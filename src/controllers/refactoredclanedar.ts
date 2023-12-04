  import MongooseRepository from './mongooseRepository';
  import MongooseQueryUtils from '../utils/mongooseQueryUtils';
  import AuditLogRepository from './auditLogRepository';
  import Error404 from '../../errors/Error404';
  import { IRepositoryOptions } from './IRepositoryOptions';
  import lodash from 'lodash';
  import Calender from '../models/calender';
  import Task from '../models/tasks';
  import mongoose from 'mongoose';
  // @ts-ignore
  import { convert } from 'html-to-text';
  import company from '../models/company';
  import internalCompanyMapping from '../models/internalCompanyMapping';

  class CalenderRepository {
    static async _createAuditLog(
      action,
      id,
      data,
      options: IRepositoryOptions,
    ) {
      await AuditLogRepository.log(
        {
          entityName: Calender(options.database).modelName,
          entityId: id,
          action,
          values: data,
        },
        options,
      );
    }
    static async findById(id, options: IRepositoryOptions) {
      // const currentTenant = MongooseRepository.getCurrentTenant(
      //   options,
      // );

      let record =
        await MongooseRepository.wrapWithSessionIfExists(
          Calender(options.database)
            .findOne({ _id: id })
            .populate([
              {
                path: 'calender',
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
      const { fetch, assignedTo,createdBy,companyId } = query;
      var data;
      const currentUser =
        MongooseRepository.getCurrentUser(options);
        const userId = currentUser._id;
        const basePopulation = [
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
          ];

        if (
          currentUser?.role === 'admin' ||
          currentUser?.role === 'internalUser'
        ) {
          let companyFilter: any = {};
          companyFilter['taskCreatedFor'] = {
            ['$in']: ['task', 'calendar'],
          };
          if (currentUser.role === 'admin') {
            if (companyId !== 'none') companyFilter.company = companyId;
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
                    companyId: 1, // Include the companyId field in the 
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
            all: {
              query:  { ...companyFilter },
              sort: { dueDate: 1 },
              isChecked: false,
            },
            upcoming: {
              query: {
                ...companyFilter,
                dueDate: { $gt: new Date() },
              },
              sort: { dueDate: 1 },
              isChecked: false,
            },
            past: {
              query: {
                ...companyFilter,
                dueDate: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
              },
              sort: { dueDate: 1 },
            },
            default: {
              query: { ...companyFilter },
              sort: { dueDate: -1 },
            },
          };
          
          const selectedQuery = queryOptionsMap[fetch] || queryOptionsMap.default;
            data = await Task(options.database)
          .find(selectedQuery.query)
          .sort(selectedQuery.sort)
          .populate(basePopulation)

        }
        else{
              const queryOptionsMap = {
                all: {
                  query:  {company:companyId,isChecked: false, },
                  sort: { dueDate: 1 },
                  isChecked: false,
                },
                upcoming: {
                  query: {
                    company:companyId,isChecked: false,
                    dueDate: { $gt: new Date() },
                  },
                  sort: { dueDate: 1 },
                  isChecked: false,
                },
                past: {
                  query: {
                    company:companyId,isChecked: false,
                    dueDate: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
                  },
                  sort: { dueDate: 1 },
                },
                default: {
                  query: { company:companyId,isChecked: false, },
                  sort: { dueDate: -1 },
                },
              };
              const selectedQuery = queryOptionsMap[fetch] || queryOptionsMap.default;
            data = await Task(options.database)
            .find(selectedQuery.query)
            .sort(selectedQuery.sort)
            .populate(basePopulation)
        }
          
      if (data == null) {
        data = [];
      } else {
        data.forEach((item) => {
          item.description = convert(item.description, {
            wordwrap: 50,
          });
        });
        const dataNullDueDate = data.filter(
          (item) => item.dueDate === null,
        );
        const dataNotNullDueDate = data.filter(
          (item) => item.dueDate !== null,
        );

        data = [...dataNotNullDueDate, ...dataNullDueDate];
      }
      return {
        success: true,
        data,
      };
    }
    static async create(data, options: IRepositoryOptions) {
      const [record] = await Calender(
        options.database,
      ).create(
        [
          {
            ...data,
          },
        ],
        options,
      );
      return true;
    }
    static async destroy(id, options: IRepositoryOptions) {
      // const currentTenant = MongooseRepository.getCurrentTenant(
      //   options,
      // );
      let record =
        await MongooseRepository.wrapWithSessionIfExists(
          Calender(options.database).findOne({ _id: id }),
          options,
        );

      if (!record) {
        throw new Error404();
      }

      await Calender(options.database).deleteOne(
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
          Calender(options.database).findOne({ _id: id }),
          options,
        );

      if (!record) {
        throw new Error404();   
      }

      await Calender(options.database).updateOne(
        { _id: id },
        {
          ...data,
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
  }

  export default CalenderRepository;