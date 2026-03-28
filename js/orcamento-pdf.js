/**
 * PDF da proposta de orçamento (jsPDF)
 * Depende de: config.js, orcamentos-compat.js, orcamentos-logic.js (desconto)
 */
function formatarMoedaOrcPdf(n) {
    var x = Number(n) || 0;
    return "R$ " + x.toFixed(2).replace(".", ",");
}

function gerarOrcamentoPropostaPDF(orcamento) {
    if (typeof window.jspdf === "undefined") {
        alert("Biblioteca de PDF não carregada.");
        return;
    }
    var empresa = (typeof CONFIG !== "undefined" && CONFIG.nomeEmpresa) ? CONFIG.nomeEmpresa : "Confeitaria";
    var diasValidade = (typeof CONFIG !== "undefined" && CONFIG.validadeOrcamentoDias) ? CONFIG.validadeOrcamentoDias : 15;
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var y = 18;
    var margem = 18;
    var maxW = 174;

    function linha(texto, dy, size) {
        dy = dy || 6;
        if (size) doc.setFontSize(size);
        var lines = doc.splitTextToSize(String(texto || ""), maxW);
        doc.text(lines, margem, y);
        y += Math.max(dy, lines.length * 5);
        if (y > 280) {
            doc.addPage();
            y = 18;
        }
    }

    doc.setFillColor(245, 240, 234);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFontSize(16);
    doc.setTextColor(92, 64, 51);
    doc.text(empresa, margem, 16);
    doc.setTextColor(0, 0, 0);
    y = 32;

    doc.setFontSize(11);
    linha("PROPOSTA DE ORCAMENTO — EVENTOS / DOCERIA", 8);
    linha("Referencia: " + (orcamento.id || ""), 6, 10);
    var hoje = new Date();
    var validade = new Date(hoje);
    validade.setDate(validade.getDate() + diasValidade);
    linha("Data da proposta: " + hoje.toLocaleDateString("pt-BR") + "  |  Validade: " + validade.toLocaleDateString("pt-BR"), 6, 9);

    y += 4;
    doc.setFontSize(12);
    linha("Cliente", 7);
    doc.setFontSize(10);
    linha("Nome: " + (orcamento.cliente || orcamento.nome_cliente || "-"), 6);
    linha("Telefone: " + (orcamento.telefone || "-") + "  |  E-mail: " + (orcamento.email || "-"), 6);

    y += 2;
    doc.setFontSize(12);
    linha("Evento", 7);
    doc.setFontSize(10);
    linha("Tipo: " + (eventoTipoOrc(orcamento) || "-"), 6);
    linha("Data do evento: " + (eventoDataOrc(orcamento) || "-"), 6);
    linha("Convidados: " + (orcamento.convidados != null ? orcamento.convidados : "-") + "  |  Local: " + (localOrc(orcamento) || "-"), 6);
    linha("Entrega / retirada: " + (orcamento.entrega || orcamento.entrega_retirada || "-"), 6);

    y += 2;
    doc.setFontSize(12);
    linha("Itens", 7);
    doc.setFontSize(10);
    if (orcamento.itens && orcamento.itens.length) {
        orcamento.itens.forEach(function (it) {
            var pu = it.preco_unitario != null ? it.preco_unitario : it.preco;
            var sub = it.subtotal != null ? it.subtotal : (Number(pu) || 0) * (Number(it.quantidade) || 0);
            linha((it.quantidade || 0) + " x " + (it.nome || "") + " — " + formatarMoedaOrcPdf(sub), 6);
        });
    } else {
        linha("(sem itens)", 6);
    }

    var vo = valorOriginalOrcCompat(orcamento);
    var tipoD = orcamento.desconto_tipo;
    var valD = orcamento.desconto_valor;
    var vDesc = orcamento.valor_desconto;
    if ((vDesc == null || vDesc === "") && typeof descontoEquivalenteEmReais === "function") {
        vDesc = descontoEquivalenteEmReais(vo, tipoD, valD);
    }
    var vf = valorFinalOrc(orcamento);

    y += 2;
    doc.setFontSize(12);
    linha("Valores", 7);
    doc.setFontSize(10);
    linha("Valor original: " + formatarMoedaOrcPdf(vo), 6);
    linha("Desconto: " + formatarMoedaOrcPdf(Number(vDesc) || 0), 6);
    doc.setFontSize(11);
    linha("VALOR FINAL: " + formatarMoedaOrcPdf(vf), 7);

    y += 2;
    doc.setFontSize(10);
    linha("Forma de pagamento: " + (formaPagamentoOrc(orcamento) || "-"), 6);
    var ent = orcamento.entrada;
    var rest = orcamento.restante;
    if (ent != null && ent !== "" || rest != null && rest !== "") {
        linha("Entrada: " + formatarMoedaOrcPdf(ent) + "  |  Restante: " + formatarMoedaOrcPdf(rest), 6);
    }
    if (orcamento.data_pagamento_entrada) {
        linha("Data pagamento entrada: " + orcamento.data_pagamento_entrada, 6);
    }
    if (orcamento.data_pagamento_final) {
        linha("Data pagamento final: " + orcamento.data_pagamento_final, 6);
    }
    linha("Observacoes: " + (orcamento.observacoes || "-"), 6);

    if (orcamento.degustacao_data || orcamento.degustacao_obs) {
        y += 2;
        linha("Degustacao: " + (orcamento.degustacao_data || "") + " " + (orcamento.degustacao_hora || "") + " — " + (orcamento.degustacao_obs || ""), 6);
    }

    doc.save("orcamento-" + (orcamento.id || "doc") + ".pdf");
}
