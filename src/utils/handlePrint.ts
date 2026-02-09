import { statusConfig } from "@/components/order-card"
import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"

export const handlePrintOrder = (order: PreparoProducao) => {
  const printWindow = window.open("", "_blank", "width=750,height=600")

  if (!printWindow) return

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="margin-bottom: 8px;">
        <div><strong>${item.qtde}x ${item.nome}</strong></div>
        ${
          item.adicionais && item.adicionais.length > 0
            ? item.adicionais
                .map(
                  (add) =>
                    `<div style="margin-left:10px;font-size:13px;">+ ${add.qtde}x ${add.nome}</div>`
                )
                .join("")
            : ""
        }
        ${
          item.observacao
            ? `<div style="font-size: 12px; margin-left: 10px;"><em>Obs: ${item.observacao}</em></div>`
            : ""
        }
      </div>
    `
    )
    .join("")

  const html = `
    <html>
      <head>
        <title>Pedido #${order.keyId}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            margin: 8px;
            color: #000;
          }
          h1 {
            text-align: center;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .section {
            margin-bottom: 10px;
          }
          hr {
            border: none;
            border-top: 1px dashed #aaa;
            margin: 6px 0;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <h1>Pedido #${order.keyId}</h1>
        <div class="section">
          <div><strong>Cliente:</strong> ${order.clienteNome}</div>
          ${order.mesaNumero ? `<div><strong>Mesa:</strong> ${order.mesaNumero}</div>` : ""}
          ${order.garcom ? `<div><strong>Garçom:</strong> ${order.garcom}</div>` : ""}
          <div><strong>Status:</strong> ${statusConfig[order.status].label}</div>
          <div><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString("pt-BR")}</div>
        </div>

        <hr />

        <div class="section">
          ${itemsHtml}
        </div>

        ${
          order.observacao
            ? `<div class="section"><strong>Observações gerais:</strong><br>${order.observacao}</div>`
            : ""
        }

        <hr />
        <div class="footer">Sistema de Produção - ${order.pdv}</div>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  // ✅ Espera o DOM ser renderizado antes de imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 300)
  }
}
