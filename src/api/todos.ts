import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

export const USER_ID = 3439;

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const createTodo = ({ title, completed, userId }: Omit<Todo, 'id'>) => {
  return client.post<Todo>(`/todos`, { title, completed, userId });
};

export const updateTodo = ({ title, completed, userId, id }: Todo) => {
  if (!id) {
    throw new Error('Todo id is required');
  }

  return client.patch<Todo>(`/todos/${id}`, { title, completed, userId });
};

export const deleteTodo = (todoId: number) => {
  return client.delete<number>(`/todos/${todoId}`);
};
