import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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
      // Nueva página para gráficos
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Evolución del Valor del Inventario', 14, yPos)
      yPos += 8

      const imgWidth = pageWidth - 28 // Margen de 14 a cada lado
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

  // Nueva página si es necesario
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  // Distribución por Categorías (tabla)
  if (data.categorias && data.categorias.length > 0) {
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

  // GRÁFICO: Comparación Mensual
  try {
    const mensualChartImage = await captureChartAsImage('monthly-comparison-chart')
    if (mensualChartImage) {
      // Nueva página para el gráfico mensual
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Comparación Mensual de Movimientos', 14, yPos)
      yPos += 8

      const imgWidth = pageWidth - 28
      const imgHeight = 80
      doc.addImage(mensualChartImage, 'PNG', 14, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 15
    }
  } catch (error) {
    console.error('Error agregando gráfico mensual:', error)
  }

  // Comparación mensual (tabla) si hay espacio
  if (data.comparacionMensual && data.comparacionMensual.length > 0) {
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle Comparación Mensual', 14, yPos)
    yPos += 8

    const mensualData = data.comparacionMensual.map(m => [
      m.mes,
      `Q${m.entradas.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`,
      m.salidas.toString(),
      m.diferencia > 0 ? `+Q${m.diferencia.toLocaleString('es-GT', { maximumFractionDigits: 0 })}` : `Q${m.diferencia.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Mes', 'Inversión', 'Salidas', 'Diferencia']],
      body: mensualData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    })
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Guardar el PDF
  const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
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
