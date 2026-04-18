import cors from 'cors';
import express, { type Request, type Response } from 'express';

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

interface StudentPayload {
  name?: string;
  cpf?: string;
  email?: string;
}

type RouteId = string | string[] | undefined;

let students: Student[] = [];
let nextId = 1;

const isEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);
const normalize = (value: string): string => value.trim();

const validatePayload = (payload: StudentPayload): string | null => {
  const name = normalize(payload.name ?? '');
  const cpf = normalize(payload.cpf ?? '');
  const email = normalize(payload.email ?? '');

  if (!name || !cpf || !email) {
    return 'name, cpf e email sao obrigatorios';
  }

  if (!isEmail(email)) {
    return 'email invalido';
  }

  return null;
};

const hasDuplicateData = (cpf: string, email: string, ignoreId?: string): boolean =>
  students.some(
    (student) =>
      student.id !== ignoreId &&
      (student.cpf.toLowerCase() === cpf.toLowerCase() ||
        student.email.toLowerCase() === email.toLowerCase()),
  );

export const resetStudentsStore = (): void => {
  students = [];
  nextId = 1;
};

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/students', (_req: Request, res: Response) => {
    res.status(200).json(students);
  });

  app.post('/students', (req: Request, res: Response) => {
    const payload = req.body as StudentPayload;
    const error = validatePayload(payload);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const name = normalize(payload.name!);
    const cpf = normalize(payload.cpf!);
    const email = normalize(payload.email!);

    if (hasDuplicateData(cpf, email)) {
      return res
        .status(409)
        .json({ message: 'ja existe aluno com mesmo cpf ou email' });
    }

    const student: Student = {
      id: String(nextId++),
      name,
      cpf,
      email,
    };

    students.push(student);
    return res.status(201).json(student);
  });

  app.put('/students/:id', (req: Request, res: Response) => {
    const id = parseRouteId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id invalido' });
    }

    const payload = req.body as StudentPayload;
    const error = validatePayload(payload);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const current = students.find((student) => student.id === id);
    if (!current) {
      return res.status(404).json({ message: 'aluno nao encontrado' });
    }

    const name = normalize(payload.name!);
    const cpf = normalize(payload.cpf!);
    const email = normalize(payload.email!);

    if (hasDuplicateData(cpf, email, id)) {
      return res
        .status(409)
        .json({ message: 'ja existe aluno com mesmo cpf ou email' });
    }

    const updated: Student = { id, name, cpf, email };
    students = students.map((student) => (student.id === id ? updated : student));

    return res.status(200).json(updated);
  });

  app.delete('/students/:id', (req: Request, res: Response) => {
    const id = parseRouteId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id invalido' });
    }

    const previousLength = students.length;
    students = students.filter((student) => student.id !== id);

    if (students.length === previousLength) {
      return res.status(404).json({ message: 'aluno nao encontrado' });
    }

    return res.status(204).send();
  });

  return app;
};
  const parseRouteId = (routeId: RouteId): string | null => {
    if (typeof routeId !== 'string') {
      return null;
    }

    const id = routeId.trim();
    return id.length > 0 ? id : null;
  };
