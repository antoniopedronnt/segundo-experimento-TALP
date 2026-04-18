import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

interface Student {
  id: string
  name: string
  cpf: string
  email: string
}

interface StudentForm {
  name: string
  cpf: string
  email: string
}

const EMPTY_FORM: StudentForm = {
  name: '',
  cpf: '',
  email: '',
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStudents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/students`)
      if (!response.ok) {
        throw new Error('Nao foi possivel carregar os alunos.')
      }

      const data = (await response.json()) as Student[]
      setStudents(data)
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const firstLoad = async () => {
      try {
        const response = await fetch(`${API_URL}/students`)
        if (!response.ok) {
          throw new Error('Nao foi possivel carregar os alunos.')
        }

        const data = (await response.json()) as Student[]
        if (active) {
          setStudents(data)
        }
      } catch (requestError) {
        if (active) {
          setError((requestError as Error).message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void firstLoad()

    return () => {
      active = false
    }
  }, [])

  const updateField = (field: keyof StudentForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const clearForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const submitStudent = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const endpoint = editingId ? `${API_URL}/students/${editingId}` : `${API_URL}/students`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        setError(body.message ?? 'Nao foi possivel salvar o aluno.')
        return
      }

      await loadStudents()
      clearForm()
    } catch {
      setError('Nao foi possivel salvar o aluno.')
    }
  }

  const removeStudent = async (id: string) => {
    setError(null)
    try {
      const response = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        setError(body.message ?? 'Nao foi possivel remover o aluno.')
        return
      }

      await loadStudents()

      if (editingId === id) {
        clearForm()
      }
    } catch {
      setError('Nao foi possivel remover o aluno.')
    }
  }

  const startEditing = (student: Student) => {
    setEditingId(student.id)
    setForm({ name: student.name, cpf: student.cpf, email: student.email })
  }

  return (
    <main className="page">
      <h1>Gerenciamento de alunos</h1>

      <form className="student-form" onSubmit={submitStudent}>
        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Nome do aluno"
            required
          />
        </label>

        <label>
          CPF
          <input
            value={form.cpf}
            onChange={(event) => updateField('cpf', event.target.value)}
            placeholder="CPF"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="email@exemplo.com"
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit">{editingId ? 'Salvar alteracao' : 'Cadastrar aluno'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={clearForm}>
              Cancelar edicao
            </button>
          )}
        </div>
      </form>

      {error && <p className="feedback error">{error}</p>}
      {loading && <p className="feedback">Carregando alunos...</p>}

      <section className="student-list">
        <h2>Alunos cadastrados</h2>
        {students.length === 0 ? (
          <p>Nenhum aluno cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Email</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.cpf}</td>
                  <td>{student.email}</td>
                  <td className="actions">
                    <button type="button" className="secondary" onClick={() => startEditing(student)}>
                      Alterar
                    </button>
                    <button type="button" className="danger" onClick={() => void removeStudent(student.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

export default App
