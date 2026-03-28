/**
 * Geração de contrato em PDF (jsPDF via CDN na página admin)
 */
function gerarContratoPDF(orcamento) {
    if (typeof window.jspdf === "undefined") {
        alert("Biblioteca de PDF não carregada.");
        return;
    }
    var empresa = (typeof CONFIG !== "undefined" && CONFIG.nomeEmpresa) ? CONFIG.nomeEmpresa : "Confeitaria";
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var y = 20;
    var margem = 20;
    var maxW = 170;

    function linha(texto, dy) {
        dy = dy || 7;
        var lines = doc.splitTextToSize(String(texto || ""), maxW);
        doc.text(lines, margem, y);
        y += lines.length * dy;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    }

    doc.setFontSize(16);
    doc.text("CONTRATO DE PRESTACAO DE SERVICOS — DOCES / EVENTOS", margem, y);
    y += 12;

    doc.setFontSize(11);
    linha("Referencia do orcamento: " + (orcamento.id || ""));
    linha("Contratante: " + (orcamento.nome_cliente || orcamento.cliente || ""));
    linha("Data do evento: " + formatarDataEventoLabel(orcamento.evento_data || orcamento.data_evento));
    linha("Empresa: " + empresa);
    y += 4;

    doc.setFontSize(12);
    linha("ITENS CONTRATADOS (resumo)", 8);
    doc.setFontSize(10);
    if (orcamento.itens && orcamento.itens.length) {
        orcamento.itens.forEach(function (it) {
            var pu = it.preco_unitario != null ? it.preco_unitario : it.preco;
            var sub = it.subtotal != null ? it.subtotal : (Number(pu) || 0) * (Number(it.quantidade) || 0);
            linha(
                (it.quantidade || 0) + " x " + (it.nome || "") + " — " + formatarMoedaPdf(sub)
            );
        });
    } else {
        linha("(sem itens registrados)");
    }
    y += 4;

    doc.setFontSize(11);
    var vOrig = orcamento.valor_original != null ? orcamento.valor_original : orcamento.total;
    linha("Valor original (tabela): " + formatarMoedaPdf(vOrig));
    if (orcamento.desconto_tipo && orcamento.desconto_valor) {
        linha(
            "Desconto: " +
                (orcamento.desconto_tipo === "percentual"
                    ? orcamento.desconto_valor + "%"
                    : formatarMoedaPdf(orcamento.desconto_valor))
        );
    }
    doc.setFontSize(12);
    var vFin = orcamento.valor_final != null ? orcamento.valor_final : vOrig;
    linha("VALOR FINAL: " + formatarMoedaPdf(vFin));
    y += 4;

    doc.setFontSize(10);
    linha("Forma de pagamento: " + (orcamento.forma_pagamento_ref || "a combinar"));
    linha("Observacoes: " + (orcamento.observacoes || "-"));
    linha("Data do documento: " + new Date().toLocaleDateString("pt-BR"));
    y += 12;

    linha("______________________________________________");
    linha("Assinatura do contratante");
    linha("");
    linha("______________________________________________");
    linha("Assinatura " + empresa + " / representante");

    doc.save("contrato-" + (orcamento.id || "documento") + ".pdf");
}

function formatarMoedaPdf(n) {
    var x = Number(n) || 0;
    return "R$ " + x.toFixed(2).replace(".", ",");
}

function formatarDataEventoLabel(s) {
    if (!s) return "-";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        var p = s.split("-");
        return p[2] + "/" + p[1] + "/" + p[0];
    }
    return s;
}
