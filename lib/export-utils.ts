import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Salida } from './api'

// ============================================================================
// UTILIDADES PARA EXPORTAR A PDF Y EXCEL
// ============================================================================

interface ExportReporteData {
  titulo: string
  stats: {
    totalMovimientos: number
    rotacionPromedio: number
    diasPromedioStock: number
    eficiencia: number
  }
  topProductos: any[]
  categorias: any[]
  comparacionMensual: any[]
  valorInventario: any[]
  fechaGeneracion?: Date
  rangoFechas?: { inicio?: Date; fin?: Date }
}

// Función auxiliar para capturar un chart como imagen
const captureChartAsImage = async (chartId: string): Promise<string | null> => {
  try {
    const chartElement = document.querySelector(`#${chartId}`)
    if (!chartElement) {
      console.warn(`Chart con id ${chartId} no encontrado`)
      return null
    }

    // Buscar el SVG dentro del elemento
    const svgElement = chartElement.querySelector('svg')
    if (!svgElement) {
      console.warn(`SVG no encontrado en chart ${chartId}`)
      return null
    }

    // Clonar el SVG para no afectar el original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement

    // Obtener dimensiones
    const bbox = svgElement.getBoundingClientRect()
    clonedSvg.setAttribute('width', bbox.width.toString())
    clonedSvg.setAttribute('height', bbox.height.toString())

    // Aplicar estilos inline
    const styles = window.getComputedStyle(svgElement)
    clonedSvg.style.backgroundColor = styles.backgroundColor || 'white'

    // Serializar SVG a string
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)

    // Crear un canvas para convertir SVG a imagen
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = bbox.width * 2 // 2x para mejor calidad
      canvas.height = bbox.height * 2
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(null)
        return
      }

      const img = new Image()
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      img.onload = () => {
        // Fondo blanco
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)

        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      img.src = url
    })
  } catch (error) {
    console.error('Error capturando chart:', error)
    return null
  }
}

export const exportarReportePDF = async (data: ExportReporteData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPos = 20

  // Encabezado
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.titulo, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Fecha de generación
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const fechaTexto = data.fechaGeneracion
    ? data.fechaGeneracion.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
  doc.text(`Fecha de generación: ${fechaTexto}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5

  // Rango de fechas si existe
  if (data.rangoFechas?.inicio && data.rangoFechas?.fin) {
    const rangoTexto = `Período: ${data.rangoFechas.inicio.toLocaleDateString('es-GT')} - ${data.rangoFechas.fin.toLocaleDateString('es-GT')}`
    doc.text(rangoTexto, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10
  } else {
    yPos += 5
  }

  // Línea separadora
  doc.setLineWidth(0.5)
  doc.line(14, yPos, pageWidth - 14, yPos)
  yPos += 10

  // Estadísticas principales
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen General', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const statsData = [
    ['Total de Movimientos', data.stats.totalMovimientos.toString()],
    ['Rotación Promedio', `${data.stats.rotacionPromedio.toFixed(1)}x`],
    ['Días Promedio en Stock', `${data.stats.diasPromedioStock} días`],
    ['Eficiencia de Inventario', `${data.stats.eficiencia.toFixed(1)}%`]
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
    margin: { left: 14, right: 14 }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // GRÁFICO: Evolución del Valor del Inventario
  try {
    const valorChartImage = await captureChartAsImage('valor-inventario-chart')
    if (valorChartImage) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Evolución del Valor del Inventario', 14, yPos)
      yPos += 8

      const imgWidth = pageWidth - 28 
      const imgHeight = 80
      doc.addImage(valorChartImage, 'PNG', 14, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 15
    }
  } catch (error) {
    console.error('Error agregando gráfico de valor:', error)
  }

  // GRÁFICO: Distribución por Categorías
  try {
    const categoriaChartImage = await captureChartAsImage('categoria-distribution-chart')
    if (categoriaChartImage) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Distribución por Categoría', 14, yPos)
      yPos += 8

      const imgWidth = pageWidth - 28
      const imgHeight = 80
      doc.addImage(categoriaChartImage, 'PNG', 14, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 15
    }
  } catch (error) {
    console.error('Error agregando gráfico de categorías:', error)
  }

  // Nueva página para tablas
  if (yPos > 150) {
    doc.addPage()
    yPos = 20
  }

  // Top Productos
  if (data.topProductos && data.topProductos.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Top 10 Productos Más Movidos', 14, yPos)
    yPos += 8

    const productosData = data.topProductos.slice(0, 10).map((p, index) => [
      (index + 1).toString(),
      p.nombre,
      p.entradas.toString(),
      p.salidas.toString(),
      (p.entradas + p.salidas).toString(),
      p.rotacion.toFixed(2),
      `Q${p.valorInventario.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Producto', 'Entradas', 'Salidas', 'Total', 'Rotación', 'Valor']],
      body: productosData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Distribución por Categorías (tabla)
  if (data.categorias && data.categorias.length > 0) {
    // Check space
    if (yPos > 220) {
        doc.addPage()
        yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen por Categoría', 14, yPos)
    yPos += 8

    const categoriasData = data.categorias.map(c => [
      c.categoria,
      c.productos.toString(),
      `Q${c.valor.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`,
      `${c.porcentaje}%`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Categoría', 'Productos', 'Valor Total', '% del Total']],
      body: categoriasData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Guardar el PDF
  const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

// ============================================================================
// NUEVO: GENERADOR DE COMANDA (TICKET POS)
// ============================================================================

export const generarComandaPDF = (salida: Salida, nombreEmpresa: string = 'Inventario Hotel', preview: boolean = false) => {
  // Configuración de ticket (hoja estrecha ~80mm width)
  // jsPDF unit: mm. Format [width, height]. Height is dynamic but we start large.
  const ticketWidth = 80
  const ticketHeight = 200 // Initial, can be irrelevant if we don't paginate
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [ticketWidth, ticketHeight]
  })

  let y = 10
  const margin = 5
  const contentWidth = ticketWidth - (margin * 2)
  const centerX = ticketWidth / 2

  // --- HEADER ---
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreEmpresa, centerX, y, { align: 'center' })
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (salida.destino) {
     doc.text(salida.destino, centerX, y, { align: 'center' })
     y += 4
  }
  
  doc.setFontSize(8)
  doc.text(`Fecha: ${new Date(salida.fechaSalida).toLocaleDateString('es-GT', { timeZone: 'UTC' })}`, margin, y)
  y += 4
  doc.text(`Ticket: ${salida.numeroSalida}`, margin, y)
  y += 4
  if (salida.cliente) {
      doc.text(`Cliente: ${salida.cliente}`, margin, y)
      y += 4
  }

  // --- SEPARATOR ---
  doc.setLineWidth(0.1)
  doc.line(margin, y, ticketWidth - margin, y)
  y += 3

  // --- ITEMS ---
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  // Headers: Cant | Desc | Total
  doc.text("Cant", margin, y)
  doc.text("Descripcion", margin + 10, y)
  doc.text("Total", ticketWidth - margin, y, { align: 'right' })
  y += 4
  doc.setFont('helvetica', 'normal')

  const detalles = salida.detalles || salida.detalleSalida || []
  let granTotal = 0

  detalles.forEach(detalle => {
      const nombreProducto = typeof detalle.producto === 'string' ? detalle.producto : (detalle.producto?.nombre || 'Producto')
      // Truncar nombre si muy largo
      const cleanName = nombreProducto.length > 20 ? nombreProducto.substring(0, 20) + '..' : nombreProducto
      
      const cantidad = detalle.cantidad
      // Calcular subtotal si no viene (fallback)
      const subtotal = detalle.subtotal || (detalle.precioUnitario ? (detalle.precioUnitario * cantidad) : 0)
      
      const priceTxt = `Q${subtotal.toFixed(2)}`
      
      doc.text(cantidad.toString(), margin, y)
      doc.text(cleanName, margin + 10, y)
      doc.text(priceTxt, ticketWidth - margin, y, { align: 'right' })
      y += 4
      
      // Si hay precio unitario y es > 1 unidad, mostrar "@ Q.xx"
      if (cantidad > 1 && detalle.precioUnitario) {
          doc.setFontSize(7)
          doc.setTextColor(100)
          doc.text(`   @ Q${detalle.precioUnitario.toFixed(2)}`, margin + 10, y)
          doc.setTextColor(0)
          doc.setFontSize(8)
          y += 3
      }
      
      granTotal += subtotal
  })

  // --- TOTALS ---
  y += 2
  doc.line(margin, y, ticketWidth - margin, y)
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const finalTotal = salida.total ?? granTotal
  doc.text("TOTAL:", margin, y)
  doc.text(`Q${finalTotal.toFixed(2)}`, ticketWidth - margin, y, { align: 'right' })
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (salida.metodoPago) {
      doc.text(`Pago: ${salida.metodoPago}`, margin, y)
      y += 5
  }

  // --- FOOTER ---
  y += 5
  doc.setFontSize(7)
  doc.text("¡Gracias por su compra!", centerX, y, { align: 'center' })
  
  if (preview) {
    return doc.output('bloburl')
  }

  // Guardar
  doc.save(`Ticket_${salida.numeroSalida}.pdf`)
}

// ============================================================================
// NUEVO: GENERADOR DE FACTURA / PROFORMA (CARTA/A4)
// ============================================================================

export const generarFacturaPDF = (salida: Salida, nombreEmpresa: string = 'Inventario Hotel', preview: boolean = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  // --- HEADER EMPRESA ---
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40)
  doc.text(nombreEmpresa, 15, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)

  let yPos = 26
  if (salida.destino) {
    doc.text(`Sede: ${salida.destino}`, 15, yPos)
    yPos += 5
  }
  doc.text("Dirección Principal", 15, yPos) // Personalizar según config
  doc.text("Teléfono: (502) 1234-5678", 15, yPos + 5)

  // --- DATOS FACTURA (Derecha) ---
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text("COMPROBANTE DE SALIDA", 200, 20, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. Documento: ${salida.numeroSalida}`, 200, 28, { align: 'right' })
  doc.text(`Fecha: ${new Date(salida.fechaSalida).toLocaleDateString('es-GT', { timeZone: 'UTC' })}`, 200, 33, { align: 'right' })
  doc.text(`Estado: ${salida.estado}`, 200, 38, { align: 'right' })

  // --- DATOS CLIENTE ---
  doc.setDrawColor(220)
  doc.line(15, 45, 200, 45) // Línea separadora

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text("Datos del Cliente / Destino:", 15, 53)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const clienteNombre = salida.cliente || salida.destino || 'Consumidor Final'
  doc.text(`Cliente: ${clienteNombre}`, 15, 60)
  if (salida.referencia) {
    doc.text(`Referencia: ${salida.referencia}`, 15, 65)
  }
  if (salida.observaciones) {
    doc.text(`Observaciones: ${salida.observaciones}`, 15, 70)
  }

  // --- TABLA DE PRODUCTOS ---
  let startY = salida.observaciones ? 75 : 70
  let granTotal = 0

  const detalles = salida.detalles || salida.detalleSalida || []

  const tableRows = detalles.map(detalle => {
    const nombre = typeof detalle.producto === 'string' ? detalle.producto : (detalle.producto?.nombre || 'Producto')
    const precio = detalle.precioUnitario || 0
    // Si no hay subtotal guardado, calcularlo
    const subtotal = detalle.subtotal || (precio * detalle.cantidad)
    granTotal += subtotal

    return [
      detalle.cantidad,
      nombre,
      detalle.lote || '-',
      `Q${precio.toFixed(2)}`,
      `Q${subtotal.toFixed(2)}`
    ]
  }) || []

  autoTable(doc, {
    startY: startY,
    head: [['Cant.', 'Descripción', 'Lote', 'Precio Unit.', 'Subtotal']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 10, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 }, // Cant
      1: { cellWidth: 'auto' }, // Desc
      2: { halign: 'center', cellWidth: 30 }, // Lote
      3: { halign: 'right', cellWidth: 30 }, // Precio
      4: { halign: 'right', cellWidth: 30 }  // Subtotal
    },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  // --- TOTALES ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10
  const totalDoc = salida.total ?? granTotal

  doc.setFontSize(10)
  doc.text("Método de Pago:", 15, finalY)
  doc.setFont('helvetica', 'bold')
  doc.text(salida.metodoPago || 'N/A', 45, finalY)

  doc.setFontSize(12)
  doc.text("TOTAL:", 160, finalY, { align: 'right' })
  doc.setFontSize(14)
  doc.text(`Q${totalDoc.toFixed(2)}`, 200, finalY, { align: 'right' })

  // --- FOOTER ---
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  doc.text("Este documento es un comprobante interno de inventario y no sustituye una factura fiscal.", 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' })

  if (preview) {
    return doc.output('bloburl')
  }

  doc.save(`Comprobante_${salida.numeroSalida}.pdf`)
}

export const exportarReporteExcel = (data: ExportReporteData) => {
  // Crear un nuevo workbook
  const wb = XLSX.utils.book_new()

  // Hoja 1: Resumen General
  const resumenData = [
    ['REPORTE DE INVENTARIO'],
    [`Generado: ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`],
    [],
    ['RESUMEN GENERAL'],
    ['Total de Movimientos', data.stats.totalMovimientos],
    ['Rotación Promedio', `${data.stats.rotacionPromedio.toFixed(1)}x`],
    ['Días Promedio en Stock', `${data.stats.diasPromedioStock} días`],
    ['Eficiencia de Inventario', `${data.stats.eficiencia.toFixed(1)}%`]
  ]

  if (data.rangoFechas?.inicio && data.rangoFechas?.fin) {
    resumenData.splice(2, 0, [
      `Período: ${data.rangoFechas.inicio.toLocaleDateString('es-GT')} - ${data.rangoFechas.fin.toLocaleDateString('es-GT')}`
    ])
  }

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)

  // Estilos para el título
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // Hoja 2: Top Productos
  if (data.topProductos && data.topProductos.length > 0) {
    const productosHeaders = [['#', 'Producto', 'SKU', 'Entradas', 'Salidas', 'Total Mov.', 'Rotación', 'Valor Inventario']]
    const productosData = data.topProductos.map((p, index) => [
      index + 1,
      p.nombre,
      p.sku,
      p.entradas,
      p.salidas,
      p.entradas + p.salidas,
      p.rotacion,
      p.valorInventario
    ])

    const wsProductos = XLSX.utils.aoa_to_sheet([...productosHeaders, ...productosData])
    wsProductos['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 }
    ]

    XLSX.utils.book_append_sheet(wb, wsProductos, 'Top Productos')
  }

  // Hoja 3: Distribución por Categorías
  if (data.categorias && data.categorias.length > 0) {
    const categoriasHeaders = [['Categoría', 'Productos', 'Valor Total', '% del Total']]
    const categoriasData = data.categorias.map(c => [
      c.categoria,
      c.productos,
      c.valor,
      c.porcentaje
    ])

    const wsCategorias = XLSX.utils.aoa_to_sheet([...categoriasHeaders, ...categoriasData])
    wsCategorias['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 }]

    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorías')
  }

  // Hoja 4: Comparación Mensual
  if (data.comparacionMensual && data.comparacionMensual.length > 0) {
    const mensualHeaders = [['Mes', 'Inversión (Q)', 'Salidas', 'Diferencia']]
    const mensualData = data.comparacionMensual.map(m => [
      m.mes,
      m.entradas,
      m.salidas,
      m.diferencia
    ])

    const wsMensual = XLSX.utils.aoa_to_sheet([...mensualHeaders, ...mensualData])
    wsMensual['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]

    XLSX.utils.book_append_sheet(wb, wsMensual, 'Comparación Mensual')
  }

  // Hoja 5: Evolución del Valor
  if (data.valorInventario && data.valorInventario.length > 0) {
    const valorHeaders = [['Mes', 'Valor Inventario']]
    const valorData = data.valorInventario.map(v => [
      v.mes,
      v.valor
    ])

    const wsValor = XLSX.utils.aoa_to_sheet([...valorHeaders, ...valorData])
    wsValor['!cols'] = [{ wch: 15 }, { wch: 18 }]

    XLSX.utils.book_append_sheet(wb, wsValor, 'Evolución Valor')
  }

  // Guardar el archivo
  const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export const exportarReporteCSV = (data: ExportReporteData) => {
  const rows: string[] = []

  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  // Helper to write a section
  const writeSection = (title: string, headers: string[], items: any[]) => {
    rows.push(title)
    rows.push(headers.join(','))
    for (const it of items) {
      const line = headers.map(h => escape(it[h] ?? ''))
      rows.push(line.join(','))
    }
    rows.push('')
  }

  // Top Productos
  if (data.topProductos && data.topProductos.length > 0) {
    const headers = ['rank', 'nombre', 'sku', 'entradas', 'salidas', 'totalMovimientos', 'rotacion', 'valorInventario']
    const items = data.topProductos.map((p: any, i: number) => ({
      rank: i + 1,
      nombre: p.nombre,
      sku: p.sku ?? '',
      entradas: p.entradas ?? 0,
      salidas: p.salidas ?? 0,
      totalMovimientos: (p.entradas ?? 0) + (p.salidas ?? 0),
      rotacion: p.rotacion ?? 0,
      valorInventario: p.valorInventario ?? 0
    }))
    writeSection('Top Productos', headers, items)
  }

  // Categorías
  if (data.categorias && data.categorias.length > 0) {
    const headers = ['categoria', 'productos', 'valor', 'porcentaje']
    const items = data.categorias.map(c => ({
      categoria: c.categoria,
      productos: c.productos,
      valor: c.valor,
      porcentaje: c.porcentaje
    }))
    writeSection('Distribucion por Categorias', headers, items)
  }

  // Comparacion mensual
  if (data.comparacionMensual && data.comparacionMensual.length > 0) {
    const headers = ['mes', 'entradas', 'salidas', 'diferencia']
    const items = data.comparacionMensual.map(m => ({ mes: m.mes, entradas: m.entradas, salidas: m.salidas, diferencia: m.diferencia }))
    writeSection('Comparacion Mensual', headers, items)
  }

  // Valor inventario
  if (data.valorInventario && data.valorInventario.length > 0) {
    const headers = ['mes', 'valor']
    const items = data.valorInventario.map(v => ({ mes: v.mes, valor: v.valor }))
    writeSection('Valor Inventario por Mes', headers, items)
  }

  const csvContent = rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.csv`
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
