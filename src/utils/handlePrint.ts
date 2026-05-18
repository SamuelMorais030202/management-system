import { statusConfig } from "@/components/order-card"
import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"

/** Largura da bobina em mm (80 = padrão cozinha; use 58 se a impressora for 58mm) */
const RECEIPT_WIDTH_MM = 80

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const buildItemsHtml = (order: PreparoProducao) =>
  order.items
    .map(
      (item) => `
      <div class="item">
        <div class="item-name">${escapeHtml(String(item.qtde))}x ${escapeHtml(item.nome)}</div>
        ${
          item.adicionais?.length
            ? item.adicionais
                .map(
                  (add) =>
                    `<div class="addon">+ ${escapeHtml(String(add.qtde ?? item.qtde))}x ${escapeHtml(add.nome)}</div>`
                )
                .join("")
            : ""
        }
        ${
          item.observacao
            ? `<div class="item-obs">Obs: ${escapeHtml(item.observacao)}</div>`
            : ""
        }
      </div>
    `
    )
    .join("")

const buildReceiptDocument = (order: PreparoProducao) => {
  const itemsHtml = buildItemsHtml(order)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Pedido #${order.preparoProducaoId}</title>
  <style>
    @page {
      size: ${RECEIPT_WIDTH_MM}mm auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html {
      width: ${RECEIPT_WIDTH_MM}mm;
      margin: 0;
      padding: 0;
    }

    body {
      width: ${RECEIPT_WIDTH_MM}mm;
      max-width: ${RECEIPT_WIDTH_MM}mm;
      margin: 0;
      padding: 0;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ticket {
      width: ${RECEIPT_WIDTH_MM}mm;
      padding: 3mm 2mm;
    }

    .center { text-align: center; }

    .order-id {
      font-size: 22px;
      font-weight: bold;
      margin: 0 0 2mm;
    }

    .meta {
      font-size: 13px;
      margin-bottom: 1.5mm;
    }

    .status {
      display: inline-block;
      font-size: 11px;
      font-weight: bold;
      padding: 1mm 2mm;
      margin-top: 1mm;
      border: 1px solid #000;
    }

    hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 2.5mm 0;
    }

    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .item { margin-bottom: 3mm; }

    .item-name {
      font-size: 15px;
      font-weight: bold;
      word-wrap: break-word;
    }

    .addon {
      font-size: 12px;
      margin-left: 3mm;
      margin-top: 0.5mm;
    }

    .item-obs {
      font-size: 12px;
      margin-top: 1mm;
      padding: 1mm;
      border: 1px dashed #000;
      word-wrap: break-word;
    }

    .general-obs {
      font-size: 12px;
      padding: 1.5mm;
      border: 2px solid #000;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .footer {
      text-align: center;
      font-size: 10px;
      margin-top: 2mm;
    }

    @media print {
      html, body {
        width: ${RECEIPT_WIDTH_MM}mm !important;
        max-width: ${RECEIPT_WIDTH_MM}mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      .ticket {
        width: ${RECEIPT_WIDTH_MM}mm !important;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <p class="order-id">PEDIDO #${order.preparoProducaoId}</p>
      <p class="status">${statusConfig[order.status].label}</p>
    </div>

    <hr />

    <div class="meta"><strong>Cliente:</strong> ${escapeHtml(order.clienteNome || "—")}</div>
    ${order.mesaNumero ? `<div class="meta"><strong>Mesa:</strong> ${escapeHtml(String(order.mesaNumero))}</div>` : ""}
    ${order.garcom ? `<div class="meta"><strong>Garçom:</strong> ${escapeHtml(order.garcom)}</div>` : ""}
    <div class="meta"><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString("pt-BR")}</div>
    ${order.tempoPreparo ? `<div class="meta"><strong>Tempo est.:</strong> ${order.tempoPreparo} min</div>` : ""}

    <hr />

    <p class="section-title">Itens</p>
    ${itemsHtml}

    ${
      order.observacao
        ? `
    <hr />
    <p class="section-title">Obs. geral</p>
    <div class="general-obs">${escapeHtml(order.observacao)}</div>
    `
        : ""
    }

    <hr />
    <p class="footer">${escapeHtml(order.pdv || "Cozinha")}</p>
  </div>
</body>
</html>`
}

export const handlePrintOrder = (order: PreparoProducao) => {
  const existingFrame = document.getElementById("kitchen-print-frame")
  existingFrame?.remove()

  const iframe = document.createElement("iframe")
  iframe.id = "kitchen-print-frame"
  iframe.setAttribute("aria-hidden", "true")
  iframe.setAttribute(
    "style",
    [
      "position:fixed",
      "left:0",
      "top:0",
      `width:${RECEIPT_WIDTH_MM}mm`,
      "height:0",
      "border:0",
      "margin:0",
      "padding:0",
      "opacity:0",
      "pointer-events:none",
      "z-index:-1",
    ].join(";")
  )

  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = frameWindow?.document

  if (!frameWindow || !frameDoc) {
    iframe.remove()
    return
  }

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    iframe.remove()
  }

  const triggerPrint = () => {
    const fallbackTimer = window.setTimeout(cleanup, 30_000)
    frameWindow.addEventListener(
      "afterprint",
      () => {
        window.clearTimeout(fallbackTimer)
        cleanup()
      },
      { once: true }
    )

    frameWindow.focus()
    frameWindow.print()
  }

  frameDoc.open()
  frameDoc.write(buildReceiptDocument(order))
  frameDoc.close()

  // Aguarda layout do iframe antes de abrir o diálogo de impressão
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(triggerPrint, 100)
    })
  })
}
