import assert from 'node:assert/strict';
import { Given, When, Then } from '@cucumber/cucumber';
import request, { type Response } from 'supertest';
import { createApp, resetStudentsStore, type Student } from '../../../server/src/app';

let lastResponse: Response | undefined;

const api = () => request(createApp());

Given('que nao existem alunos cadastrados', () => {
  resetStudentsStore();
  lastResponse = undefined;
});

When(
  'eu cadastro um aluno com nome {string}, cpf {string} e email {string}',
  async (name: string, cpf: string, email: string) => {
    lastResponse = await api().post('/students').send({ name, cpf, email });
    assert.equal(lastResponse.status, 201);
  },
);

When(
  'eu altero o aluno de cpf {string} para nome {string} e email {string}',
  async (cpf: string, name: string, email: string) => {
    const listResponse = await api().get('/students');
    assert.equal(listResponse.status, 200);

    const student = (listResponse.body as Student[]).find((item) => item.cpf === cpf);
    assert.ok(student, `Aluno com cpf ${cpf} nao encontrado para alteracao`);

    lastResponse = await api()
      .put(`/students/${student.id}`)
      .send({ name, cpf, email });

    assert.equal(lastResponse.status, 200);
  },
);

When('eu removo o aluno de cpf {string}', async (cpf: string) => {
  const listResponse = await api().get('/students');
  assert.equal(listResponse.status, 200);

  const student = (listResponse.body as Student[]).find((item) => item.cpf === cpf);
  assert.ok(student, `Aluno com cpf ${cpf} nao encontrado para remocao`);

  lastResponse = await api().delete(`/students/${student.id}`);
  assert.equal(lastResponse.status, 204);
});

Then('deve existir {int} aluno cadastrado', async (quantity: number) => {
  const listResponse = await api().get('/students');
  assert.equal(listResponse.status, 200);
  assert.equal((listResponse.body as Student[]).length, quantity);
});

Then(
  'deve existir {int} alunos cadastrados',
  async (quantity: number) => {
    const listResponse = await api().get('/students');
    assert.equal(listResponse.status, 200);
    assert.equal((listResponse.body as Student[]).length, quantity);
  },
);

Then(
  'o aluno de cpf {string} deve ter nome {string} e email {string}',
  async (cpf: string, name: string, email: string) => {
    const listResponse = await api().get('/students');
    assert.equal(listResponse.status, 200);

    const student = (listResponse.body as Student[]).find((item) => item.cpf === cpf);
    assert.ok(student, `Aluno com cpf ${cpf} nao encontrado na listagem`);
    assert.equal(student.name, name);
    assert.equal(student.email, email);
  },
);
