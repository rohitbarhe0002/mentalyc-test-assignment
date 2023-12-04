//taskkkkk
import mongoose from 'mongoose';
import MongooseRepository from './mongooseRepository';
import MongooseQueryUtils from '../utils/mongooseQueryUtils';
import AuditLogRepository from './auditLogRepository';
import Error404 from '../../errors/Error404';
import { IRepositoryOptions } from './IRepositoryOptions';
import lodash from 'lodash';
import Tasks from '../models/tasks';
import User from '../models/user';
// import CompanyUserMapping from '../models/companyUserMapping';
import internalCompanyMapping from '../models/internalCompanyMapping';

class TasksRepository {
  static async create(data, options: IRepositoryOptions) {
    // const currentTenant = MongooseRepository.getCurrentTenant(
    //   options,
    // );

    const currentUser =
      MongooseRepository.getCurrentUser(options);

    const [record] = await Tasks(options.database).create(
      [
        {
          ...data,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      ],
      options,
    );
    await this._createAuditLog(
      AuditLogRepository.CREATE,
      record.id,
      data,
      options,
    );
    const demo = await this.findById(record.id, options);
    return this.findById(record.id, options);
  }

  static async update(
    id,
    data,
    options: IRepositoryOptions,
  ) {
    // const currentTenant = MongooseRepository.getCurrentTenant(
    //   options,
    // );

    let record =
      await MongooseRepository.wrapWithSessionIfExists(
        Tasks(options.database).findOne({ _id: id }),
        options,
      );

    if (!record) {
      throw new Error404();
    }

    await Tasks(options.database).updateOne(
      { _id: id },
      {
        ...data,
        updatedBy:
          MongooseRepository.getCurrentUser(options).id,
      },
      options,
    );

    await this._createAuditLog(
      AuditLogRepository.UPDATE,
      id,
      data,
      options,
    );

    record = await this.findById(id, options);

    return record;
  }

  static async destroy(id, options: IRepositoryOptions) {
    // const currentTenant = MongooseRepository.getCurrentTenant(
    //   options,
    // );
    let record =
      await MongooseRepository.wrapWithSessionIfExists(
        Tasks(options.database).findOne({ _id: id }),
        options,
      );

    if (!record) {
      throw new Error404();
    }

    await Tasks(options.database).deleteOne(
      { _id: id },
      options,
    );

    await this._createAuditLog(
      AuditLogRepository.DELETE,
      id,
      record,
      options,
    );
  }

  static async filterIdInTenant(
    id,
    options: IRepositoryOptions,
  ) {
    return lodash.get(
      await this.filterIdsInTenant([id], options),
      '[0]',
      null,
    );
  }

  static async filterIdsInTenant(
    ids,
    options: IRepositoryOptions,
  ) {
    if (!ids || !ids.length) {
      return [];
    }

    const currentTenant =
      MongooseRepository.getCurrentTenant(options);

    const records = await Tasks(options.database)
      .find({
        _id: { $in: ids },
        tenant: currentTenant.id,
      })
      .select(['_id']);

    return records.map((record) => record._id);
  }

  static async count(filter, options: IRepositoryOptions) {
    const currentTenant =
      MongooseRepository.getCurrentTenant(options);

    return MongooseRepository.wrapWithSessionIfExists(
      Tasks(options.database).countDocuments({
        ...filter,
        tenant: currentTenant.id,
      }),
      options,
    );
  }

  static async findById(id, options: IRepositoryOptions) {
    // const currentTenant = MongooseRepository.getCurrentTenant(
    //   options,
    // );

    let record =
      await MongooseRepository.wrapWithSessionIfExists(
        Tasks(options.database)
          .findOne({ _id: id })
          .populate([
            {
              path: 'createdBy',
              select: 'fullName',
            },
            {
              path: 'updatedBy',
              select: 'fullName',
            },
            {
              path: 'company',
              select: 'companyName',
            },
            {
              path: 'assignedTo',
              select: 'fullName',
            },
          ]),
        options,
      );

    if (!record) {
      throw new Error404();
    }

    //return this._mapRelationshipsAndFillDownloadUrl(record);
    return {
      success: true,
      data: record,
    };
  }

  static async findAndCountAll(
    { query },
    options: IRepositoryOptions,
  ) {
    const { companyId, assignedTo, createdBy } = query;
    const currentUser =
      MongooseRepository.getCurrentUser(options);
    const userId = currentUser._id;
    let searchData;
  const  basePopulation =  [
      {
        path: 'createdBy',
        select: 'fullName',
      },
      {
        path: 'updatedBy',
        select: 'fullName',
      },
      {
        path: 'company',
        select: 'companyName',
      },
      {
        path: 'assignedTo',
        select: 'fullName',
      },
    ]

    if (
      currentUser?.role === 'admin' ||
      currentUser?.role === 'internalUser'
    ) {
      let companyFilter: any = {
        taskCreatedFor: 'task',
      };
      if (currentUser.role === 'admin') {
        if (companyId !== 'none')
          companyFilter.company = companyId;
      } else {
        if (companyId === 'none') {
          const companyIds = await internalCompanyMapping(
            options.database,
          ).aggregate([
            {
              $match: {
                usersAssigned: {
                  $elemMatch: {
                    $eq: userId,
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                companyId: 1, // Include the companyId field in the output
              },
            },
          ]);
          const companyIdsArr = companyIds.map((item) =>
            mongoose.Types.ObjectId(item.companyId),
          );

          companyFilter['company'] = {
            ['$in']: companyIdsArr,
          };
        } else {
          companyFilter.company = companyId;
        }
      }
      // companyFilter.company = companyId;
      if (assignedTo !== 'none' && createdBy != 'none') {
        companyFilter['$or'] = [
          { assignedTo: assignedTo },
          { createdBy: createdBy },
        ];
      } else {
        if (assignedTo !== 'none')
          companyFilter[assignedTo] = assignedTo;
        if (createdBy != 'none')
          companyFilter.createdBy = createdBy;
      }

      const queryOptionsMap = {
      
          query:  {company:companyId,isChecked: false, },
          sort: { dueDate: 1 },
         
        },
       
      
      searchData =
        assignedTo === 'none' || assignedTo === ''
          ? await Tasks(options.database)
              .find(queryOptionsMap.query)
              .populate(basePopulation)
          : await Tasks(options.database)
              .find(queryOptionsMap.query)
              .sort(queryOptionsMap.sort)   
              .populate(basePopulation);
    } else {

      const queryOptionsMap = {
          company: currentUser?.company,
          isChecked: false,
      };

      searchData = await Tasks(options.database)
        .find(queryOptionsMap)
        .populate(basePopulation);
    }
    const totalCount = await Tasks(
      options.database,
    ).countDocuments();

    return {
      success: true,
      data: searchData,
    };

    // data = await Promise.all(
    //   data.map(this._mapRelationshipsAndFillDownloadUrl),
    // );

    // return { count, data };
  }

  static async findAllAutocomplete(
    search,
    limit,
    options: IRepositoryOptions,
  ) {
    const currentTenant =
      MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: Array<any> = [
      {
        tenant: currentTenant.id,
      },
    ];

    if (search) {
      criteriaAnd.push({
        $or: [
          {
            _id: MongooseQueryUtils.uuid(search),
          },
        ],
      });
    }

    const sort = MongooseQueryUtils.sort('id_ASC');
    const limitEscaped = Number(limit || 0) || undefined;

    const criteria = { $and: criteriaAnd };

    const records = await Tasks(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    return records.map((record) => ({
      id: record.id,
      label: record.id,
    }));
  }

  static async _createAuditLog(
    action,
    id,
    data,
    options: IRepositoryOptions,
  ) {
    await AuditLogRepository.log(
      {
        entityName: Tasks(options.database).modelName,
        entityId: id,
        action,
        values: data,
      },
      options,
    );
  }

  static async _mapRelationshipsAndFillDownloadUrl(record) {
    if (!record) {
      return null;
    }

    const output = record.toObject
      ? record.toObject()
      : record;

    return output;
  }

  static async assign(
    taskId,
    userId,
    options: IRepositoryOptions,
  ) {
    const currentUser =
      MongooseRepository.getCurrentUser(options);

    const task =
      await MongooseRepository.wrapWithSessionIfExists(
        Tasks(options.database).findById({ _id: taskId }),
        options,
      );

    if (!task) {
      throw new Error404();
    }

    const user =
      await MongooseRepository.wrapWithSessionIfExists(
        User(options.database).findById({ _id: userId }),
        options,
      );

    if (!user) {
      throw new Error404();
    }

    if (!user.tasks.find((item) => item == taskId)) {
      user.tasks.push(taskId);
    }
    task.company = userId;
    task.updatedBy = currentUser.id;

    await task.save();

    const record = await user.save();

    await this._createAuditLog(
      AuditLogRepository.ASSIGN,
      record.id,
      record,
      options,
    );
    return record;
  }
}

export default TasksRepository;