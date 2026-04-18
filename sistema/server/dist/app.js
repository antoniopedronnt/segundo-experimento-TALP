"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = exports.resetStudentsStore = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
let students = [];
let nextId = 1;
const isEmail = (value) => /\S+@\S+\.\S+/.test(value);
const normalize = (value) => value.trim();
const validatePayload = (payload) => {
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
const hasDuplicateData = (cpf, email, ignoreId) => students.some((student) => student.id !== ignoreId &&
    (student.cpf.toLowerCase() === cpf.toLowerCase() ||
        student.email.toLowerCase() === email.toLowerCase()));
const resetStudentsStore = () => {
    students = [];
    nextId = 1;
};
exports.resetStudentsStore = resetStudentsStore;
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get('/students', (_req, res) => {
        res.status(200).json(students);
    });
    app.post('/students', (req, res) => {
        const payload = req.body;
        const error = validatePayload(payload);
        if (error) {
            return res.status(400).json({ message: error });
        }
        const name = normalize(payload.name);
        const cpf = normalize(payload.cpf);
        const email = normalize(payload.email);
        if (hasDuplicateData(cpf, email)) {
            return res
                .status(409)
                .json({ message: 'ja existe aluno com mesmo cpf ou email' });
        }
        const student = {
            id: String(nextId++),
            name,
            cpf,
            email,
        };
        students.push(student);
        return res.status(201).json(student);
    });
    app.put('/students/:id', (req, res) => {
        const id = parseRouteId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'id invalido' });
        }
        const payload = req.body;
        const error = validatePayload(payload);
        if (error) {
            return res.status(400).json({ message: error });
        }
        const current = students.find((student) => student.id === id);
        if (!current) {
            return res.status(404).json({ message: 'aluno nao encontrado' });
        }
        const name = normalize(payload.name);
        const cpf = normalize(payload.cpf);
        const email = normalize(payload.email);
        if (hasDuplicateData(cpf, email, id)) {
            return res
                .status(409)
                .json({ message: 'ja existe aluno com mesmo cpf ou email' });
        }
        const updated = { id, name, cpf, email };
        students = students.map((student) => (student.id === id ? updated : student));
        return res.status(200).json(updated);
    });
    app.delete('/students/:id', (req, res) => {
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
exports.createApp = createApp;
const parseRouteId = (routeId) => {
    if (typeof routeId !== 'string') {
        return null;
    }
    const id = routeId.trim();
    return id.length > 0 ? id : null;
};
