/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';

const errors: string[] = [
  'Unable to load todos',
  'Title should not be empty',
  'Unable to add a todo',
  'Unable to delete a todo',
  'Unable to update a todo',
];

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');

  const [isUpdateState, setIsUpdateState] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);

  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const [query, setQuery] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  function showError(message: string) {
    setErrorMessage(message);

    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  }

  // #region loadTodos
  useEffect(() => {
    todoService
      .getTodos()
      .then(fetchedTodos => {
        setTodos(fetchedTodos);
      })
      .catch(() => {
        showError(errors[0]);
      });
  }, []);
  // #endgregion

  // #region Add

  // eslint-disable-next-line
  function addTodo({ title, completed, userId }: Todo) {
    setErrorMessage('');

    return todoService
      .createTodo({ title, completed, userId })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      });
  }

  const addToList = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (query.trim() === '') {
        showError(errors[1]);

        return;
      }

      addTodo({
        title: query,
        completed: false,
        userId: todoService.USER_ID,
      }).catch(() => {
        showError(errors[2]);
      });
      setQuery('');
      setFilter('all');
    }
  };

  // #endregion

  // #region filter
  useEffect(() => {
    switch (filter) {
      case 'active':
        setFilteredTodos(todos.filter(todo => !todo.completed));
        break;
      case 'completed':
        setFilteredTodos(todos.filter(todo => todo.completed));
        break;
      case 'all':
      default:
        setFilteredTodos(todos);
    }
  }, [filter, todos]);

  const handleQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleFilter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const value =
      event.currentTarget.getAttribute('href')?.replace('#/', '') || 'all';

    setFilter(value as 'all' | 'active' | 'completed');
  };

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

  const toggleOneTodo = (todoId: number) => {
    return setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  // #endregion

  // #region Delete
  function deleteTodo(todoId: number) {
    setLoadingIds(ids => [...ids, todoId]);

    return todoService
      .deleteTodo(todoId)
      .then(() => {
        setTodos(current => current.filter(t => t.id !== todoId));
      })
      .catch(() => {
        showError(errors[3]);
      })
      .finally(() => {
        setLoadingIds(ids => ids.filter(id => id !== todoId));
      });
  }

  const handleToggleOneTodo = (id: number) => {
    toggleOneTodo(id);
  };

  const deleteCompletedTodos = () => {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    Promise.all(completedIds.map(id => deleteTodo(id!)))
      .then(() => {
        setTodos(currentTodos => currentTodos.filter(todo => !todo.completed));
      })
      .catch(() => setErrorMessage(errors[3]));
  };

  // #endregion

  // #region errorMessage
  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  // #endregion

  // #region UpdateTodo
  function updateTodo(updatedTodo: Todo) {
    return todoService
      .updateTodo(updatedTodo)
      .then(todo => {
        setTodos(currentTodos => {
          const newTodos = [...currentTodos];
          const index = newTodos.findIndex(el => el.id === updatedTodo.id);

          newTodos.splice(index, 1, todo);

          return newTodos;
        });
      })
      .catch(() => {
        showError(errors[4]);
      });
  }

  const handleOnSubmitUpdateTodo = async (
    e: React.FormEvent<HTMLFormElement>,
    id: number,
    todo: Todo,
  ) => {
    e.preventDefault();

    if (!id) {
      return;
    }

    if (title.trim() === '') {
      deleteTodo(id);
      setIsUpdateState(false);

      return;
    }

    try {
      await updateTodo({ ...todo, title });
    } catch {
      showError(errors[4]);
    } finally {
      setIsUpdateState(false);
    }
  };

  // #endregion
  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length >= 1 && (
            <button
              type="button"
              className="todoapp__toggle-all active"
              onClick={toggleToCompleteAllTodos}
              data-cy="ToggleAllButton"
            />
          )}

          {/* Add a todo on form submit */}
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
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => {
            const isLoading = loadingIds.includes(todo.id!);

            return (
              <React.Fragment key={todo.id}>
                {!isUpdateState && !isLoading && (
                  <div
                    data-cy="Todo"
                    className={cn('todo', { completed: todo.completed })}
                  >
                    <label className="todo__status-label">
                      <input
                        data-cy="TodoStatus"
                        type="checkbox"
                        className="todo__status"
                        onChange={() => handleToggleOneTodo(todo.id!)}
                        checked={todo.completed}
                      />
                    </label>
                    <span
                      data-cy="TodoTitle"
                      className="todo__title"
                      onDoubleClick={() => {
                        setIsUpdateState(true);
                        setTitle(todo.title);
                      }}
                    >
                      {todo.title}
                    </span>

                    {/* Remove button appears only on hover */}
                    <button
                      type="button"
                      className="todo__remove"
                      data-cy="TodoDelete"
                      onClick={() => deleteTodo(todo.id!)}
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
                )}

                {isUpdateState && !isLoading && (
                  <div
                    data-cy="Todo"
                    className={cn('todo', { completed: todo.completed })}
                  >
                    {/* This todo is being edited */}

                    <label className="todo__status-label">
                      <input
                        data-cy="TodoStatus"
                        type="checkbox"
                        className="todo__status"
                        onChange={() => handleToggleOneTodo(todo.id!)}
                        checked={todo.completed}
                      />
                    </label>

                    {/* This form is shown instead of the title and remove button */}
                    <form
                      onSubmit={e =>
                        handleOnSubmitUpdateTodo(e, todo.id!, todo)
                      }
                    >
                      <input
                        data-cy="TodoTitleField"
                        type="text"
                        className="todo__title-field"
                        placeholder="Empty todo will be deleted"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        onBlur={() => setIsUpdateState(false)}
                        autoFocus
                      />
                    </form>
                  </div>
                )}
                {/* This todo is in loadind state */}
                {isLoading && (
                  <div
                    data-cy="Todo"
                    className={cn('todo', { completed: todo.completed })}
                  >
                    <label className="todo__status-label">
                      <input
                        data-cy="TodoStatus"
                        type="checkbox"
                        className="todo__status"
                        checked={todo.completed}
                      />
                    </label>

                    <span data-cy="TodoTitle" className="todo__title">
                      {todo.title}
                    </span>

                    <button
                      type="button"
                      className="todo__remove"
                      data-cy="TodoDelete"
                    >
                      ×
                    </button>

                    {/* 'is-active' class puts this modal on top of the todo */}
                    <div
                      data-cy="TodoLoader"
                      className="modal overlay is-active"
                    >
                      {/*  eslint-disable-next-line */}
                      <div className="modal-background has-background-white-ter" />
                      <div className="loader" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length >= 1 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todos.filter(todo => !todo.completed).length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={cn('filter__link', { selected: filter === 'all' })}
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
              onClick={deleteCompletedTodos}
              disabled={!todos.some(todo => todo.completed)}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>
      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      {errors.includes(errorMessage) && (
        <div
          data-cy="ErrorNotification"
          className={cn(
            'notification',
            'is-danger',
            'is-light',
            'has-text-weight-normal',
            { hidden: !errorMessage },
          )}
        >
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setErrorMessage('')}
          />
          {errorMessage}
        </div>
      )}
    </div>
  );
};
