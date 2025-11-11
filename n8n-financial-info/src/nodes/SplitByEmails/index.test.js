/**
 * Testes para SplitByEmails
 */

const {
  createTaskForEmail,
  hasEmails,
  splitTaskByEmails,
  splitByEmails
} = require('./index');

describe('SplitByEmails', () => {
  describe('hasEmails', () => {
    it('deve retornar true se task tem emails', () => {
      const task = { Emails: ['test@example.com'] };
      expect(hasEmails(task)).toBe(true);
    });

    it('deve retornar false se task não tem emails', () => {
      const task = { Emails: [] };
      expect(hasEmails(task)).toBe(false);
    });

    it('deve retornar false se Emails é undefined', () => {
      const task = {};
      expect(hasEmails(task)).toBe(false);
    });
  });

  describe('createTaskForEmail', () => {
    it('deve criar task com currentEmail e allEmails', () => {
      const task = {
        Id: 1,
        Subject: 'Test Task',
        Prompt: 'Test prompt'
      };
      const email = 'test@example.com';
      const allEmails = ['test@example.com', 'test2@example.com'];

      const result = createTaskForEmail(task, email, allEmails);

      expect(result.Id).toBe(1);
      expect(result.Subject).toBe('Test Task');
      expect(result.currentEmail).toBe('test@example.com');
      expect(result.allEmails).toBe('test@example.com, test2@example.com');
    });

    it('deve manter todas as propriedades originais', () => {
      const task = {
        Id: 1,
        Subject: 'Test',
        customProp: 'value'
      };
      const result = createTaskForEmail(task, 'test@test.com', ['test@test.com']);

      expect(result.customProp).toBe('value');
    });
  });

  describe('splitTaskByEmails', () => {
    it('deve dividir task em múltiplos itens', () => {
      const task = {
        Id: 1,
        Subject: 'Test Task',
        Emails: ['email1@test.com', 'email2@test.com', 'email3@test.com']
      };

      const result = splitTaskByEmails(task);

      expect(result).toHaveLength(3);
      expect(result[0].currentEmail).toBe('email1@test.com');
      expect(result[1].currentEmail).toBe('email2@test.com');
      expect(result[2].currentEmail).toBe('email3@test.com');
    });

    it('deve retornar array vazio se não tem emails', () => {
      const task = {
        Id: 1,
        Subject: 'Test Task',
        Emails: []
      };

      const result = splitTaskByEmails(task);

      expect(result).toHaveLength(0);
    });

    it('deve incluir allEmails em cada item', () => {
      const task = {
        Id: 1,
        Subject: 'Test Task',
        Emails: ['email1@test.com', 'email2@test.com']
      };

      const result = splitTaskByEmails(task);

      expect(result[0].allEmails).toBe('email1@test.com, email2@test.com');
      expect(result[1].allEmails).toBe('email1@test.com, email2@test.com');
    });
  });

  describe('splitByEmails', () => {
    it('deve processar múltiplas tasks', () => {
      const tasks = [
        {
          Id: 1,
          Subject: 'Task 1',
          Emails: ['email1@test.com', 'email2@test.com']
        },
        {
          Id: 2,
          Subject: 'Task 2',
          Emails: ['email3@test.com']
        }
      ];

      const result = splitByEmails(tasks);

      expect(result).toHaveLength(3);
      expect(result[0].Id).toBe(1);
      expect(result[1].Id).toBe(1);
      expect(result[2].Id).toBe(2);
    });

    it('deve ignorar tasks sem emails', () => {
      const tasks = [
        {
          Id: 1,
          Subject: 'Task 1',
          Emails: ['email1@test.com']
        },
        {
          Id: 2,
          Subject: 'Task 2',
          Emails: []
        }
      ];

      const result = splitByEmails(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(1);
    });

    it('deve retornar array vazio se todas as tasks não têm emails', () => {
      const tasks = [
        { Id: 1, Subject: 'Task 1', Emails: [] },
        { Id: 2, Subject: 'Task 2', Emails: [] }
      ];

      const result = splitByEmails(tasks);

      expect(result).toHaveLength(0);
    });
  });
});

