/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    todoService.getTodos().then(fetchedTodos => {
      setTodos(fetchedTodos);
      setIsLoading(false);
    });
  }, []);

  const handleFilter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const value = event.currentTarget.getAttribute('href')?.slice(2) || '';

    setFilter(value);
  };

  const handleQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  function addTodo({ title, completed, userId }: Todo) {
    todoService.createTodo({ title, completed, userId }).then(newTodo => {
      setTodos(currentTodos => [...currentTodos, newTodo]);
    });
  }

  const addToList = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query.trim() !== '') {
      addTodo({
        title: query,
        completed: false,
        userId: todoService.USER_ID,
      });
      setQuery('');
      setFilter('All');
    }
  };

  function deleteTodo(todoId: number) {
    todoService
      .deleteTodo(todoId)
      .then(() =>
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        ),
      );
  }

  const toggleToCompleteAllTodos = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    const allCompleted = todos.every(todo => todo.completed);

    const todosCopy = todos.map(todo => ({
      ...todo,
      completed: !allCompleted,
    }));

    return setTodos(todosCopy);
  };

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length >= 1 && (
            <>
              <button
                type="button"
                className="todoapp__toggle-all active"
                onClick={toggleToCompleteAllTodos}
                data-cy="ToggleAllButton"
              />
            </>
          )}

          {/* Add a todo on form submit */}
          {isLoading && (
            <form>
              <input
                data-cy="NewTodoField"
                type="text"
                value={query}
                onChange={handleQuery}
                className="todoapp__new-todo"
                placeholder="What needs to be done?"
                onKeyDown={addToList}
              />
            </form>
          )}
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {todos.length >= 1 && (
            <>
              {/* This is a completed todo */}
              {todos.map(todo => {
                return (
                  <>
                    <div
                      data-cy="Todo"
                      className={cn('todo', { completed: todo.completed })}
                      key={todo.id}
                    >
                      <label className="todo__status-label">
                        <input
                          data-cy="TodoStatus"
                          type="checkbox"
                          className="todo__status"
                        />
                      </label>
                      <span data-cy="TodoTitle" className="todo__title">
                        {todo.title}
                      </span>

                      {/* Remove button appears only on hover */}
                      <button
                        type="button"
                        className="todo__remove"
                        data-cy="TodoDelete"
                        onClick={() => {
                          if (todo.id) {
                            deleteTodo(todo.id);
                          }
                        }}
                      >
                        ×
                      </button>

                      {/* overlay will cover the todo while it is being deleted or updated */}
                      <div data-cy="TodoLoader" className="modal overlay">
                        <div
                          className="modal-background
                        has-background-white-ter"
                        />
                        <div className="loader" />
                      </div>
                    </div>
                  </>
                );
              })}

              {/* This todo is being edited */}
              <div data-cy="Todo" className="todo">
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                  />
                </label>

                {/* This form is shown instead of the title and remove button */}
                <form>
                  <input
                    data-cy="TodoTitleField"
                    type="text"
                    className="todo__title-field"
                    placeholder="Empty todo will be deleted"
                    value="Todo is being edited now"
                  />
                </form>

                <div data-cy="TodoLoader" className="modal overlay">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>

              {/* This todo is in loadind state */}
              <div data-cy="Todo" className="todo">
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  Todo is being saved now
                </span>

                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                >
                  ×
                </button>

                {/* 'is-active' class puts this modal on top of the todo */}
                <div data-cy="TodoLoader" className="modal overlay is-active">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length >= 1 && (
          <>
            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {todos.length} items left
              </span>

              {/* Active link should have the 'selected' class */}
              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={cn('filter__link', { selected: filter === '' })}
                  data-cy="FilterLinkAll"
                  onClick={handleFilter}
                >
                  All
                </a>

                <a
                  href="#/active"
                  className={cn('filter__link', {
                    selected: filter === 'active',
                  })}
                  data-cy="FilterLinkActive"
                  onClick={handleFilter}
                >
                  Active
                </a>

                <a
                  href="#/completed"
                  className={cn('filter__link', {
                    selected: filter === 'completed',
                  })}
                  data-cy="FilterLinkCompleted"
                  onClick={handleFilter}
                >
                  Completed
                </a>
              </nav>

              {/* this button should be disabled if there are no completed todos */}
              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>
      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification',
          'is-danger',
          'is-light',
          'has-text-weight-normal',
          { hidden: true },
        )}
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {/* show only one message at a time */}
        Unable to load todos
        <br />
        Title should not be empty
        <br />
        Unable to add a todo
        <br />
        Unable to delete a todo
        <br />
        Unable to update a todo
      </div>
    </div>
  );
};
