import { useEffect, useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Boton from '../common/Boton';
import InputCampo from '../common/InputCampo';
import apiClient from '../../services/apiClient';
import { TIPOS_VALOR_ANTROPOMETRICO } from '../../utils/constants';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const FORM_INICIAL = {
  id_tipo_dato_antropometrico: '',
  valor_numerico: '',
  valor_texto: '',
  descripcion: '',
};

export default function ModalDatosAntropometricos({ abierto, cerrar, alumno }) {
  const [tipos, setTipos] = useState([]);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const idAlumno = alumno?.id;

  const tipoSeleccionado = useMemo(
    () => tipos.find(t => t.id.toString() === form.id_tipo_dato_antropometrico),
    [tipos, form.id_tipo_dato_antropometrico]
  );

  const cargarDatos = async () => {
    if (!idAlumno) return;
    setCargando(true);
    try {
      const [tiposRes, datosRes] = await Promise.all([
        apiClient.get('/tipos-dato-antropometrico'),
        apiClient.get(`/alumnos/${idAlumno}/datos-antropometricos`),
      ]);
      setTipos(tiposRes.data || []);
      setDatos(datosRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar datos antropométricos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (abierto && idAlumno) {
      cargarDatos();
      setMostrarForm(false);
      setEditando(null);
      setForm(FORM_INICIAL);
      setErrores({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, idAlumno]);

  const tiposDisponibles = useMemo(() => {
    const tiposActivos = tipos.filter(t => t.estado === 1);
    const idsRegistrados = new Set(
      datos
        .filter(d => !editando || d.id !== editando.id)
        .map(d => d.id_tipo_dato_antropometrico)
    );
    return tiposActivos.filter(t => !idsRegistrados.has(t.id));
  }, [tipos, datos, editando]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrores({});
    setMostrarForm(true);
  };

  const abrirEditar = (dato) => {
    setEditando(dato);
    setForm({
      id_tipo_dato_antropometrico: dato.id_tipo_dato_antropometrico.toString(),
      valor_numerico: dato.valor_numerico !== null && dato.valor_numerico !== undefined
        ? dato.valor_numerico.toString()
        : '',
      valor_texto: dato.valor_texto || '',
      descripcion: dato.descripcion || '',
    });
    setErrores({});
    setMostrarForm(true);
  };

  const cancelarForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrores({});
  };

  const validar = () => {
    const errs = {};
    if (!form.id_tipo_dato_antropometrico) {
      errs.id_tipo_dato_antropometrico = 'Seleccione un tipo de dato';
    } else if (tipoSeleccionado) {
      if (tipoSeleccionado.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO) {
        if (form.valor_numerico === '' || form.valor_numerico === null) {
          errs.valor_numerico = 'Ingrese un valor numérico';
        } else if (!Number.isFinite(Number(form.valor_numerico))) {
          errs.valor_numerico = 'Valor numérico inválido';
        }
      } else if (tipoSeleccionado.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.TEXTO) {
        if (!form.valor_texto.trim()) {
          errs.valor_texto = 'Ingrese un valor de texto';
        }
      }
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'id_tipo_dato_antropometrico') {
        next.valor_numerico = '';
        next.valor_texto = '';
      }
      return next;
    });
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }
    const body = {
      id_tipo_dato_antropometrico: parseInt(form.id_tipo_dato_antropometrico),
      descripcion: form.descripcion.trim() || null,
    };
    if (tipoSeleccionado?.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO) {
      body.valor_numerico = Number(form.valor_numerico);
    } else {
      body.valor_texto = form.valor_texto.trim();
    }
    setGuardando(true);
    try {
      if (editando) {
        await apiClient.put(`/alumnos/${idAlumno}/datos-antropometricos/${editando.id}`, body);
        toast.success('Dato antropométrico actualizado');
      } else {
        await apiClient.post(`/alumnos/${idAlumno}/datos-antropometricos`, body);
        toast.success('Dato antropométrico registrado');
      }
      await cargarDatos();
      cancelarForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (dato) => {
    if (!confirm(`¿Eliminar el registro de "${dato.tbl_tipos_dato_antropometrico?.nombre}"?`)) return;
    try {
      await apiClient.delete(`/alumnos/${idAlumno}/datos-antropometricos/${dato.id}`);
      toast.success('Registro eliminado');
      await cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const formatearValor = (dato) => {
    const tipo = dato.tbl_tipos_dato_antropometrico;
    if (!tipo) return '-';
    if (tipo.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO) {
      const val = dato.valor_numerico;
      if (val === null || val === undefined) return '-';
      const num = typeof val === 'object' && val !== null && 'toString' in val ? val.toString() : String(val);
      return tipo.unidad ? `${num} ${tipo.unidad}` : num;
    }
    return dato.valor_texto || '-';
  };

  const esNumerico = tipoSeleccionado?.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO;
  const esTexto = tipoSeleccionado?.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.TEXTO;
  const sinTiposConfigurados = tipos.filter(t => t.estado === 1).length === 0;

  return (
    <Modal
      abierto={abierto}
      cerrar={cerrar}
      titulo={`Datos Antropométricos — ${alumno?.nombres || ''} ${alumno?.apellidos || ''}`.trim()}
      ancho="max-w-2xl"
    >
      {cargando ? (
        <div className="text-center py-6 text-slate-400 text-sm">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {!mostrarForm && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {datos.length === 0
                    ? 'Este alumno no tiene datos antropométricos registrados.'
                    : `${datos.length} registro${datos.length !== 1 ? 's' : ''}`}
                </p>
                {!sinTiposConfigurados && (
                  <Boton onClick={abrirCrear} className="inline-flex items-center gap-1.5">
                    <HiPlus className="w-4 h-4" /> Agregar
                  </Boton>
                )}
              </div>

              {sinTiposConfigurados && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  No hay tipos de dato antropométrico configurados. Solicite al administrador
                  que los configure desde la sección "Datos Antropométricos".
                </div>
              )}

              {datos.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-display font-bold text-slate-600 uppercase tracking-wider">Dato</th>
                        <th className="px-4 py-2 text-left text-xs font-display font-bold text-slate-600 uppercase tracking-wider">Valor</th>
                        <th className="px-4 py-2 text-left text-xs font-display font-bold text-slate-600 uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-2 text-center text-xs font-display font-bold text-slate-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {datos.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-semibold text-slate-700">
                            {d.tbl_tipos_dato_antropometrico?.nombre || '-'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">
                            {formatearValor(d)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">
                            {d.descripcion || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => abrirEditar(d)}
                                className="p-1 text-primary-400 hover:bg-slate-100 rounded"
                                title="Editar"
                              >
                                <HiPencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminar(d)}
                                className="p-1 text-rose-400 hover:bg-slate-100 rounded"
                                title="Eliminar"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Boton tipo="outline" onClick={cerrar}>Cerrar</Boton>
              </div>
            </>
          )}

          {mostrarForm && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <InputCampo
                label="Tipo de dato"
                name="id_tipo_dato_antropometrico"
                type="select"
                value={form.id_tipo_dato_antropometrico}
                onChange={handleChange}
                required
                placeholder="Seleccione un tipo..."
                disabled={!!editando}
                options={(editando
                  ? [editando.tbl_tipos_dato_antropometrico].filter(Boolean)
                  : tiposDisponibles
                ).map(t => ({
                  value: t.id.toString(),
                  label: t.unidad ? `${t.nombre} (${t.unidad})` : t.nombre,
                }))}
                error={errores.id_tipo_dato_antropometrico}
              />

              {!editando && tiposDisponibles.length === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Ya se registraron todos los tipos activos para este alumno. Edite el existente si necesita actualizar el valor.
                </div>
              )}

              {esNumerico && (
                <InputCampo
                  label={`Valor numérico${tipoSeleccionado?.unidad ? ` (${tipoSeleccionado.unidad})` : ''}`}
                  name="valor_numerico"
                  type="number"
                  value={form.valor_numerico}
                  onChange={handleChange}
                  placeholder="Ej: 45.5"
                  required
                  error={errores.valor_numerico}
                />
              )}

              {esTexto && (
                <InputCampo
                  label="Valor"
                  name="valor_texto"
                  type="textarea"
                  value={form.valor_texto}
                  onChange={handleChange}
                  placeholder="Ej: Sí presenta, Asma leve, etc."
                  required
                  error={errores.valor_texto}
                />
              )}

              <InputCampo
                label="Descripción (opcional)"
                name="descripcion"
                type="textarea"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Notas, fecha de medición, observaciones..."
              />

              <div className="flex justify-end gap-2 pt-2">
                <Boton tipo="outline" onClick={cancelarForm} disabled={guardando}>Cancelar</Boton>
                <Boton type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Registrar')}
                </Boton>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
