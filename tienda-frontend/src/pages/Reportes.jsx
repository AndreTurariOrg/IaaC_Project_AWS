import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';
import api from '../services/api';

const UI = {
  bgApp: '#F3F4F6',
  cardBg: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  textHeader: '#374151',
  border: '#E5E7EB',
  tableHeadBg: '#F9FAFB',
  primary: '#1abc5b',    
  link: '#2196f3',      
  rowHover: '#F9FAFB',
  successPillBg: '#ECFDF5',
  successPillText: '#1abc5b',
};

const Reportes = () => {
  const [generandoPDF, setGenerandoPDF] = useState(false);
  // Estado para el modal de generación de reporte
  const [modalReporte, setModalReporte] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('ventas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ventas, setVentas] = useState([]);
  const [fiados, setFiados] = useState([]);
    const [modalDetalle, setModalDetalle] = useState({ abierto: false, id_venta: null, datos: null, loading: false });
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tab, setTab] = useState('ventas');
  const [modalPago, setModalPago] = useState({ abierto: false, id_venta: null });
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loadingPago, setLoadingPago] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });
  const porPagina = 10;

  useEffect(() => {
    api.get('/ventas', { withCredentials: true })
      .then(res => setVentas(res.data))
      .catch(() => setVentas([]));
    api.get('/fiados', { withCredentials: true })
      .then(res => setFiados(res.data))
      .catch(() => setFiados([]));
  }, []);

  // autocierre de notificación (evita setTimeout en render)
  useEffect(() => {
    if (!notificacion.mensaje) return;
    const t = setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 2500);
    return () => clearTimeout(t);
  }, [notificacion]);

  const ventasFiltradas = ventas.filter(v => {
    const texto = busqueda.toLowerCase();
    return (
      (v.cliente || '').toLowerCase().includes(texto) ||
      (v.vendedor || '').toLowerCase().includes(texto) ||
      (v.fecha || '').toLowerCase().includes(texto)
    );
  });

  const fiadosFiltrados = fiados.filter(f => {
    const texto = busqueda.toLowerCase();
    return (
      (f.cliente || '').toLowerCase().includes(texto) ||
      (f.estado_pago || '').toLowerCase().includes(texto) ||
      (f.fecha_fiado || '').toLowerCase().includes(texto)
    );
  });

  const totalPaginas = tab === 'ventas'
    ? Math.ceil(ventasFiltradas.length / porPagina)
    : Math.ceil(fiadosFiltrados.length / porPagina);

  const paginaActual = tab === 'ventas'
    ? ventasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina)
    : fiadosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div style={{
      minHeight: '80vh',
      background: UI.bgApp,
      padding: '32px 50px',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'flex-end' // más a la derecha
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1400, // más ancho
        background: UI.cardBg,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
        padding: 24
      }}>
        {/* Encabezado */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: UI.textHeader
          }}>
            Reportes
          </h2>

          <button
            style={{
              background: UI.primary,
              color: '#FFFFFF',
              border: '1px solid ' + UI.primary,
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
            }}
            onClick={() => setModalReporte(true)}
          >
            + Generar Reporte
          </button>
      {/* Modal Generar Reporte */}
      {modalReporte && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setModalReporte(false)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Generar Reporte</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Tipo de reporte</div>
                <select value={tipoReporte} onChange={e => setTipoReporte(e.target.value)} style={{ padding: '8px', borderRadius: '7px', border: '1px solid #ccc', minWidth: '200px' }}>
                  <option value='ventas'>Ventas</option>
                  <option value='fiados'>Fiados</option>
                </select>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Desde</div>
                <input type='date' value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ padding: '8px', borderRadius: '7px', border: '1px solid #ccc', minWidth: '200px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Hasta</div>
                <input type='date' value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ padding: '8px', borderRadius: '7px', border: '1px solid #ccc', minWidth: '200px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
                <button type='button' onClick={() => setModalReporte(false)} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
                <button type='button' onClick={async () => {
                  setGenerandoPDF(true);
                  async function generarPDF() {
                    try {
                    let datos = [];
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text(`Reporte de ${tipoReporte === 'ventas' ? 'Ventas' : 'Fiados'}`, 15, 20);
                    doc.setFontSize(12);
                    doc.text(`Rango de fechas: ${fechaDesde || '-'} a ${fechaHasta || '-'}`, 15, 30);
                    let y = 40;
                    if (tipoReporte === 'ventas') {
                      datos = ventas.filter(v => {
                        const fecha = v.fecha ? new Date(v.fecha) : null;
                        const desde = fechaDesde ? new Date(fechaDesde) : null;
                        const hasta = fechaHasta ? new Date(fechaHasta) : null;
                        return (!desde || (fecha && fecha >= desde)) && (!hasta || (fecha && fecha <= hasta));
                      });
                      // Preparar datos para la tabla
                      const tableBody = datos.map(v => {
                        let total = v.total;
                        if (typeof total !== 'number') total = Number(total);
                        if (isNaN(total)) total = 0;
                        let igv = v.igv !== undefined ? Number(v.igv) : +(total * 0.18 / 1.18);
                        let sinIGV = +(total - igv);
                        return [
                          v.id_venta || '-',
                          v.cliente || '-',
                          v.fecha ? new Date(v.fecha).toLocaleDateString('es-PE') : '-',
                          `S/. ${sinIGV.toFixed(2)}`,
                          `S/. ${igv.toFixed(2)}`,
                          `S/. ${total.toFixed(2)}`,
                          v.medio_pago || v.forma_pago || '-'
                        ];
                      });
                      autoTable(doc, {
                        head: [['ID', 'Cliente', 'Fecha', 'Total sin IGV', 'IGV', 'Total con IGV', 'Medio de Pago']],
                        body: tableBody,
                        startY: y
                      });
                      y = doc.lastAutoTable.finalY + 10;
                      // Totales
                      let totalSinIGV = 0, totalIGV = 0, totalConIGV = 0;
                      datos.forEach(v => {
                        let total = v.total;
                        if (typeof total !== 'number') total = Number(total);
                        if (isNaN(total)) total = 0;
                        let igv = v.igv !== undefined ? Number(v.igv) : +(total * 0.18 / 1.18);
                        let sinIGV = +(total - igv);
                        totalSinIGV += sinIGV;
                        totalIGV += igv;
                        totalConIGV += total;
                      });
                      doc.setFontSize(14);
                      doc.text(`Total sin IGV: S/. ${totalSinIGV.toFixed(2)}`, 15, y); y += 8;
                      doc.text(`Total IGV: S/. ${totalIGV.toFixed(2)}`, 15, y); y += 8;
                      doc.text(`Total con IGV: S/. ${totalConIGV.toFixed(2)}`, 15, y); y += 8;
                      // Gráfico de ventas diarias
                      const ventasPorDia = {};
                      datos.forEach(v => {
                        const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString('es-PE') : '-';
                        let total = v.total;
                        if (typeof total !== 'number') total = Number(total);
                        if (isNaN(total)) total = 0;
                        ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + total;
                      });
                      const labels = Object.keys(ventasPorDia);
                      const data = Object.values(ventasPorDia);
                      if (labels.length > 0) {
                        // Crear gráfico en canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = 400; canvas.height = 200;
                        const ctx = canvas.getContext('2d');
                        new Chart(ctx, {
                          type: 'bar',
                          data: {
                            labels,
                            datasets: [{ label: 'Ventas Diarias', data, backgroundColor: '#1abc5b' }]
                          },
                          options: { plugins: { legend: { display: false } } }
                        });
                        await new Promise(resolve => setTimeout(resolve, 800));
                        const imgData = canvas.toDataURL('image/png');
                        if (imgData.startsWith('data:image/png')) {
                          doc.addPage();
                          doc.setFontSize(16);
                          doc.text('Gráfico de Ventas Diarias', 15, 20);
                          doc.addImage(imgData, 'PNG', 15, 30, 180, 90);
                        }
                      }
                      doc.save(`reporte_${tipoReporte}_${Date.now()}.pdf`);
                    } else {
                      datos = fiados.filter(f => {
                        const fecha = f.fecha_fiado ? new Date(f.fecha_fiado) : null;
                        const desde = fechaDesde ? new Date(fechaDesde) : null;
                        const hasta = fechaHasta ? new Date(fechaHasta) : null;
                        return (!desde || (fecha && fecha >= desde)) && (!hasta || (fecha && fecha <= hasta));
                      });
                      const tableBody = datos.map(f => {
                        let monto = f.monto || f.total || 0;
                        if (typeof monto !== 'number') monto = Number(monto);
                        if (isNaN(monto)) monto = 0;
                        let pagos = f.pagos_realizados || 0;
                        if (typeof pagos !== 'number') pagos = Number(pagos);
                        if (isNaN(pagos)) pagos = 0;
                        let pendiente = f.saldo_pendiente !== undefined ? Number(f.saldo_pendiente) : monto - pagos;
                        let vencimiento = f.fecha_limite_pago ? new Date(f.fecha_limite_pago).toLocaleDateString('es-PE') : '-';
                        return [
                          f.id_fiado || f.id_venta || '-',
                          f.cliente || '-',
                          f.fecha_fiado ? new Date(f.fecha_fiado).toLocaleDateString('es-PE') : '-',
                          `S/. ${monto.toFixed(2)}`,
                          `S/. ${pagos.toFixed(2)}`,
                          `S/. ${pendiente.toFixed(2)}`,
                          vencimiento
                        ];
                      });
                      autoTable(doc, {
                        head: [['ID', 'Cliente', 'Fecha', 'Monto Fiado', 'Pagos Realizados', 'Saldo Pendiente', 'Vencimiento']],
                        body: tableBody,
                        startY: y
                      });
                      y = doc.lastAutoTable.finalY + 10;
                      let totalFiado = 0, totalPagos = 0, totalPendiente = 0;
                      datos.forEach(f => {
                        let monto = f.monto || f.total || 0;
                        if (typeof monto !== 'number') monto = Number(monto);
                        if (isNaN(monto)) monto = 0;
                        let pagos = f.pagos_realizados || 0;
                        if (typeof pagos !== 'number') pagos = Number(pagos);
                        if (isNaN(pagos)) pagos = 0;
                        let pendiente = f.saldo_pendiente !== undefined ? Number(f.saldo_pendiente) : monto - pagos;
                        totalFiado += monto;
                        totalPagos += pagos;
                        totalPendiente += pendiente;
                      });
                      doc.setFontSize(14);
                      doc.text(`Total Fiado: S/. ${totalFiado.toFixed(2)}`, 15, y); y += 8;
                      doc.text(`Pagos Realizados: S/. ${totalPagos.toFixed(2)}`, 15, y); y += 8;
                      doc.text(`Saldo Pendiente: S/. ${totalPendiente.toFixed(2)}`, 15, y); y += 8;
                      // Gráfico de fiados diarios
                      const fiadosPorDia = {};
                      datos.forEach(f => {
                        const fecha = f.fecha_fiado ? new Date(f.fecha_fiado).toLocaleDateString('es-PE') : '-';
                        let monto = f.monto || f.total || 0;
                        if (typeof monto !== 'number') monto = Number(monto);
                        if (isNaN(monto)) monto = 0;
                        fiadosPorDia[fecha] = (fiadosPorDia[fecha] || 0) + monto;
                      });
                      const labels = Object.keys(fiadosPorDia);
                      const data = Object.values(fiadosPorDia);
                      if (labels.length > 0) {
                        const canvas = document.createElement('canvas');
                        canvas.width = 400; canvas.height = 200;
                        const ctx = canvas.getContext('2d');
                        new Chart(ctx, {
                          type: 'bar',
                          data: {
                            labels,
                            datasets: [{ label: 'Fiados Diarios', data, backgroundColor: '#2196f3' }]
                          },
                          options: { plugins: { legend: { display: false } } }
                        });
                        await new Promise(resolve => setTimeout(resolve, 800));
                        const imgData = canvas.toDataURL('image/png');
                        if (imgData.startsWith('data:image/png')) {
                          doc.addPage();
                          doc.setFontSize(16);
                          doc.text('Gráfico de Fiados Diarios', 15, 20);
                          doc.addImage(imgData, 'PNG', 15, 30, 180, 90);
                        }
                      }
                      doc.save(`reporte_${tipoReporte}_${Date.now()}.pdf`);
                    }
                    } catch (err) {
                      alert('Error al generar el PDF. Intenta nuevamente.');
                    }
                    setGenerandoPDF(false);
                    setModalReporte(false);
      {generandoPDF && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '320px', maxWidth: '90vw', position: 'relative', textAlign: 'center' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px', color: '#222' }}>Generando PDF...</h2>
            <div style={{ fontSize: '2.5rem', color: UI.primary, marginBottom: '12px' }}>⏳</div>
            <div>Por favor espera mientras se genera el reporte y el gráfico.</div>
          </div>
        </div>
      )}
                  }
                  generarPDF();
                }} style={{ background: UI.primary, color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Generar</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Tabs estilo "pestaña simple" */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['ventas', 'fiados'].map(t => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setPagina(1); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `1px solid ${active ? UI.primary : UI.border}`,
                  background: active ? '#FFFFFF' : '#F9FAFB',
                  color: active ? UI.primary : UI.textHeader,
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer'
                }}
              >
                {t === 'ventas' ? 'Ventas' : 'Fiados'}
              </button>
            );
          })}
        </div>

        {/* Buscador (como el de “Clientes”) */}
        <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', marginBottom: 12 }}>
          <input
            type="text"
            placeholder={tab === 'ventas' ? 'Buscar ventas...' : 'Buscar fiados...'}
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: `1px solid ${UI.border}`,
              outline: 'none',
              fontSize: 14,
              color: UI.textHeader
            }}
          />
        </div>

        {/* Tabla */}
        {tab === 'ventas' ? (
          <div style={{
            maxHeight: paginaActual.length > 8 ? 420 : 'none',
            overflowY: paginaActual.length > 8 ? 'auto' : 'visible',
            borderRadius: 8,
            border: `1px solid ${UI.border}`,
            marginBottom: 8,
            transition: 'max-height 0.2s'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: UI.tableHeadBg, borderBottom: `1px solid ${UI.border}` }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>FECHA</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>CLIENTE</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>TOTAL</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>VENDEDOR</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginaActual.map(v => (
                  <tr key={v.id_venta} style={{
                    borderBottom: `1px solid ${UI.border}`
                  }}>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {v.fecha ? new Date(v.fecha).toLocaleString('es-PE') : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {v.cliente}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 600 }}>
                      S/. {v.total}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {v.vendedor}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <button
                        onClick={async () => {
                          setModalDetalle({ abierto: true, id_venta: v.id_venta, datos: null, loading: true });
                          try {
                            const res = await api.get(`/venta/${v.id_venta}/detalle`, { withCredentials: true });
                            setModalDetalle({ abierto: true, id_venta: v.id_venta, datos: res.data, loading: false });
                          } catch {
                            setModalDetalle({ abierto: true, id_venta: v.id_venta, datos: null, loading: false });
                          }
                        }}
                        style={{ color: UI.link, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill={UI.link}/>
                          <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill={UI.link}/>
                        </svg>
                        Ver detalle
                      </button>
      {/* Modal Detalle Venta */}
      {modalDetalle.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 600, width: '100%', boxShadow: '0 2px 24px rgba(0,0,0,0.12)', padding: 24, position: 'relative' }}>
            <button onClick={() => setModalDetalle({ abierto: false, id_venta: null, datos: null, loading: false })} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Detalle de Venta #{modalDetalle.id_venta}</h3>
            {modalDetalle.loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>Cargando...</div>
            ) : modalDetalle.datos ? (
              <>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  <div><b>Cliente:</b> {modalDetalle.datos.cliente}</div>
                  <div><b>Fecha:</b> {modalDetalle.datos.fecha ? new Date(modalDetalle.datos.fecha).toLocaleString('es-PE') : '-'}</div>
                  <div><b>Medio de compra:</b> {modalDetalle.datos.medio_compra}</div>
                  <div><b>Tipo de pago:</b> {modalDetalle.datos.tipo_pago}</div>
                  <div><b>Forma de pago:</b> {modalDetalle.datos.forma_pago}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: UI.tableHeadBg, borderBottom: `1px solid ${UI.border}` }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#888', fontWeight: 700 }}>PRODUCTO</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 700 }}>CANTIDAD</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 700 }}>PRECIO</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 700 }}>SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalle.datos.productos.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', color: UI.textHeader }}>{p.producto}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: UI.textHeader }}>{p.cantidad}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: UI.textHeader }}>S/. {p.precio_cobrado}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: UI.textHeader }}>S/. {p.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontSize: 16 }}>
                  <div style={{ marginBottom: 2 }}><span style={{ color: UI.textMuted }}>Subtotal:</span> <b>S/. {modalDetalle.datos.subtotal}</b></div>
                  <div style={{ marginBottom: 2 }}><span style={{ color: UI.textMuted }}>IGV (18%):</span> <b>S/. {modalDetalle.datos.igv}</b></div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#059669', marginTop: 8 }}>Total: S/. {modalDetalle.datos.total}</div>
                </div>
              </>
            ) : (
              <div style={{ color: 'red', textAlign: 'center', padding: 32 }}>No se pudo cargar el detalle.</div>
            )}
          </div>
        </div>
      )}
                    </td>
                  </tr>
                ))}
                {paginaActual.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: UI.textMuted }}>
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            maxHeight: paginaActual.length > 8 ? 420 : 'none',
            overflowY: paginaActual.length > 8 ? 'auto' : 'visible',
            borderRadius: 8,
            border: `1px solid ${UI.border}`,
            marginBottom: 8,
            transition: 'max-height 0.2s'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: UI.tableHeadBg, borderBottom: `1px solid ${UI.border}` }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>FECHA DE FIADO</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>CLIENTE</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>MONTO</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>ESTADO</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>FECHA LÍMITE DE PAGO</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>FECHA DE CANCELACIÓN</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 700 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginaActual.map(f => (
                  <tr key={f.id_venta || (f.fecha_fiado + f.cliente)} style={{
                    borderBottom: `1px solid ${UI.border}`
                  }}>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {f.fecha_fiado ? new Date(f.fecha_fiado).toLocaleString('es-PE') : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {f.cliente}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 600 }}>
                      S/. {f.monto}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        background:
                          f.estado_pago === 'pagado' ? '#ECFDF5' :
                          f.estado_pago === 'cancelado' ? '#FEE2E2' :
                          '#FFF7ED',
                        color:
                          f.estado_pago === 'pagado' ? '#059669' :
                          f.estado_pago === 'cancelado' ? '#DC2626' :
                          '#EA580C',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12
                      }}>
                        {f.estado_pago === 'pagado'
                          ? 'Pagado'
                          : f.estado_pago === 'cancelado'
                          ? 'Cancelado'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {f.fecha_limite_pago ? new Date(f.fecha_limite_pago).toLocaleDateString('es-PE') : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', color: UI.textHeader, fontWeight: 500 }}>
                      {f.fecha_cancelacion ? new Date(f.fecha_cancelacion).toLocaleString('es-PE') : '-'}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {f.estado_pago === 'pendiente' && (
                        <button
                          onClick={() => { setModalPago({ abierto: true, id_venta: f.id_venta }); setMetodoPago('efectivo'); }}
                          style={{
                            background: UI.primary,
                            color: '#FFFFFF',
                            border: '1px solid ' + UI.primary,
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          Marcar como pagado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginaActual.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: UI.textMuted }}>
                      No hay fiados registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

  {/* Paginación tipo “pill buttons” */}
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 16 }}>
          <button
            disabled={pagina === 1}
            onClick={() => setPagina(pagina - 1)}
            style={{
              border: `1px solid ${UI.border}`,
              background: '#FFFFFF',
              color: UI.textHeader,
              borderRadius: 8,
              padding: '6px 10px',
              cursor: pagina === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            &lt;
          </button>
          {[...Array(totalPaginas)].map((_, i) => {
            const active = pagina === i + 1;
            return (
              <button
                key={i}
                onClick={() => setPagina(i + 1)}
                style={{
                  border: `1px solid ${active ? UI.primary : UI.border}`,
                  background: active ? UI.primary : '#FFFFFF',
                  color: active ? '#FFFFFF' : UI.textHeader,
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            );
          })}
          <button
            disabled={pagina === totalPaginas || totalPaginas === 0}
            onClick={() => setPagina(pagina + 1)}
            style={{
              border: `1px solid ${UI.border}`,
              background: '#FFFFFF',
              color: UI.textHeader,
              borderRadius: 8,
              padding: '6px 10px',
              cursor: pagina === totalPaginas || totalPaginas === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Modal método de pago */}
      {modalPago.abierto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            padding: 24,
            width: 380,
            position: 'relative'
          }}>
            <button
              onClick={() => setModalPago({ abierto: false, id_venta: null })}
              style={{
                position: 'absolute', top: 10, right: 12,
                background: 'transparent', border: 'none',
                fontSize: 22, color: UI.textMuted, cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h3 style={{ margin: 0, marginBottom: 14, fontSize: 18, fontWeight: 700, color: UI.textHeader }}>
              Seleccionar método de pago
            </h3>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {['efectivo', 'yape', 'plin'].map(metodo => {
                const active = metodoPago === metodo;
                return (
                  <label key={metodo} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    border: `1px solid ${active ? UI.primary : UI.border}`,
                    background: active ? '#F9FAFB' : '#FFFFFF',
                    padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                    fontWeight: 600, color: UI.textHeader
                  }}>
                    <input
                      type="radio"
                      name="metodoPago"
                      value={metodo}
                      checked={active}
                      onChange={e => setMetodoPago(e.target.value)}
                      style={{ accentColor: UI.primary }}
                    />
                    {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                  </label>
                );
              })}
            </div>

            <button
              style={{
                width: '100%',
                background: UI.primary,
                color: '#FFFFFF',
                border: '1px solid ' + UI.primary,
                padding: '10px 12px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: loadingPago ? 'not-allowed' : 'pointer'
              }}
              disabled={loadingPago}
              onClick={async () => {
                if (!modalPago.id_venta) {
                  setNotificacion({ mensaje: 'No se pudo actualizar: datos incompletos.', tipo: 'error' });
                  setLoadingPago(false);
                  return;
                }
                setLoadingPago(true);
                try {
                  const res = await api.post('/fiado/pagar', { id_venta: modalPago.id_venta }, { withCredentials: true });
                  if (res.data && res.data.success) {
                    setNotificacion({ mensaje: 'Fiado actualizado a pagado correctamente.', tipo: 'success' });
                    // refrescar
                    const fres = await api.get('/fiados', { withCredentials: true });
                    setFiados(fres.data);
                  } else {
                    setNotificacion({ mensaje: 'Error al actualizar fiado.', tipo: 'error' });
                  }
                } catch (err) {
                  setNotificacion({ mensaje: (err.response?.data?.error || 'Error al actualizar fiado.'), tipo: 'error' });
                }
                setLoadingPago(false);
                setModalPago({ abierto: false, id_venta: null });
              }}
            >
              ✔️ Actualizar a pagado
            </button>
          </div>
        </div>
      )}

      {/* Notificación */}
      {notificacion.mensaje && (
        <div style={{
          position: 'fixed', top: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 60
        }}>
          <div style={{
            background: notificacion.tipo === 'success' ? UI.primary : '#EF4444',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 10,
            fontWeight: 700,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            {notificacion.mensaje}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
