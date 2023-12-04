
import mongoose, { Document } from 'mongoose';

interface ITask extends Document {
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
}

const taskSchema = new mongoose.Schema<ITask>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
