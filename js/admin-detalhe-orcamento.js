/**
 * Detalhe do orçamento (admin): desconto, degustação, pagamento, WhatsApp, PDF proposta
 */
(function () {
    function getQueryId() {
        var params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    function preencherStatusSelect(select, valorAtual) {
        if (!select || typeof CONFIG === "undefined") return;
        var labels = CONFIG.STATUS_LABELS || {};
        Object.keys(labels).forEach(function (key) {
            var opt = document.createElement("option");
            opt.value = key;
            opt.textContent = labels[key];
            select.appendChild(opt);
        });
        if (valorAtual) {
            var keyAtual = statusNormalizado({ status: valorAtual });
            var existe = Array.prototype.some.call(select.options, function (opt) {
                return opt.value === keyAtual;
            });
            if (!existe) {
                var extra = document.createElement("option");
                extra.value = valorAtual;
                extra.textContent = valorAtual;
                select.appendChild(extra);
                keyAtual = valorAtual;
            }
            select.value = keyAtual;
        }
    }

    function atualizarPreviewFinal(orcamento) {
        var tipo = document.getElementById("desconto-tipo").value || null;
        var val = parseFloat(String(document.getElementById("desconto-valor").value).replace(",", ".")) || 0;
        var vo = valorOriginalOrcCompat(orcamento);
        var vf = tipo ? calcularValorFinalComDesconto(vo, tipo, val) : vo;
        document.getElementById("preview-valor-final").textContent = formatarMoeda(vf);
        var dr = tipo ? descontoEquivalenteEmReais(vo, tipo, val) : 0;
        document.getElementById("preview-desconto-reais").textContent = formatarMoeda(dr);
    }

    function numeroInput(id) {
        var el = document.getElementById(id);
        if (!el || el.value === "") return null;
        var n = parseFloat(String(el.value).replace(",", "."));
        return isNaN(n) ? null : n;
    }

    function strInput(id) {
        var el = document.getElementById(id);
        return el && el.value ? el.value.trim() : "";
    }

    function montarWhatsAppDetalhe(o) {
        var vo = valorOriginalOrcCompat(o);
        var vf = valorFinalOrc(o);
        var vd = o.valor_desconto;
        if ((vd == null || vd === "") && typeof descontoEquivalenteEmReais === "function") {
            vd = descontoEquivalenteEmReais(vo, o.desconto_tipo, o.desconto_valor);
        }
        var nome = o.cliente || o.nome_cliente || "-";
        var msg = "ORCAMENTO — " + (CONFIG.nomeEmpresa || "") + "\n\n";
        msg += "Cliente: " + nome + "\n";
        msg += "Tipo do evento: " + (eventoTipoOrc(o) || "-") + "\n";
        msg += "Data do evento: " + (eventoDataOrc(o) || "-") + "\n\n";
        msg += "ITENS:\n";
        (o.itens || []).forEach(function (it) {
            var pu = it.preco_unitario != null ? it.preco_unitario : it.preco;
            var sub = it.subtotal != null ? it.subtotal : (Number(pu) || 0) * (Number(it.quantidade) || 0);
            msg += (it.quantidade || 0) + "x " + (it.nome || "") + " — R$ " + Number(sub).toFixed(2).replace(".", ",") + "\n";
        });
        msg += "\nValor original: R$ " + Number(vo).toFixed(2).replace(".", ",");
        msg += "\nDesconto: R$ " + Number(vd || 0).toFixed(2).replace(".", ",");
        msg += "\nValor final: R$ " + Number(vf).toFixed(2).replace(".", ",");
        msg += "\n\nForma de pagamento: " + (formaPagamentoOrc(o) || "-");
        var ent = o.entrada;
        var rest = o.restante;
        if (ent != null && ent !== "" || rest != null && rest !== "") {
            msg += "\nEntrada: R$ " + Number(ent || 0).toFixed(2).replace(".", ",");
            msg += "\nRestante: R$ " + Number(rest || 0).toFixed(2).replace(".", ",");
        }
        msg += "\n\nRef: " + o.id;
        msg += "\n-------------";
        return msg;
    }

    function renderOrcamento(o) {
        document.getElementById("orc-id").textContent = o.id;
        document.getElementById("view-nome").textContent = o.cliente || o.nome_cliente || "—";
        document.getElementById("view-telefone").textContent = o.telefone || "—";
        document.getElementById("view-email").textContent = o.email || "—";
        document.getElementById("view-data-evento").textContent = eventoDataOrc(o) || "—";
        document.getElementById("view-tipo-evento").textContent = eventoTipoOrc(o) || "—";
        document.getElementById("view-convidados").textContent = o.convidados != null ? o.convidados : "—";
        document.getElementById("view-local").textContent = localOrc(o) || "—";
        document.getElementById("view-entrega").textContent = (o.entrega || o.entrega_retirada || "") + (o.endereco ? " — " + o.endereco : "");
        document.getElementById("view-obs").textContent = o.observacoes || "—";

        var ul = document.getElementById("lista-itens");
        ul.innerHTML = "";
        (o.itens || []).forEach(function (it) {
            var li = document.createElement("li");
            var pu = it.preco_unitario != null ? it.preco_unitario : it.preco;
            var sub = it.subtotal != null ? it.subtotal : (Number(pu) || 0) * (Number(it.quantidade) || 0);
            li.textContent =
                it.quantidade + " × " + (it.nome || "") + " @ " + formatarMoeda(pu) + " = " + formatarMoeda(sub);
            ul.appendChild(li);
        });

        document.getElementById("valor-original").textContent = formatarMoeda(valorOriginalOrcCompat(o));

        document.getElementById("desconto-tipo").value = o.desconto_tipo || "";
        document.getElementById("desconto-valor").value =
            o.desconto_valor != null && o.desconto_valor !== "" ? String(o.desconto_valor).replace(".", ",") : "";

        document.getElementById("degustacao-data").value = o.degustacao_data || "";
        document.getElementById("degustacao-hora").value = o.degustacao_hora || "";
        document.getElementById("degustacao-obs").value = o.degustacao_obs || "";

        var fp = formaPagamentoOrc(o);
        var selFp = document.getElementById("forma-pagamento-adm");
        if (fp && !Array.prototype.some.call(selFp.options, function (opt) { return opt.value === fp; })) {
            var op = document.createElement("option");
            op.value = fp;
            op.textContent = fp;
            selFp.appendChild(op);
        }
        selFp.value = fp || "";

        document.getElementById("entrada").value =
            o.entrada != null && o.entrada !== "" ? String(o.entrada).replace(".", ",") : "";
        document.getElementById("restante").value =
            o.restante != null && o.restante !== "" ? String(o.restante).replace(".", ",") : "";
        document.getElementById("data-pag-entrada").value = o.data_pagamento_entrada || "";
        document.getElementById("data-pag-final").value = o.data_pagamento_final || "";

        var selStatus = document.getElementById("status-orcamento");
        selStatus.innerHTML = "";
        preencherStatusSelect(selStatus, o.status);
        atualizarPreviewFinal(o);
    }

    var orcamentoAtual = null;

    function patchComumExtra() {
        var tipo = document.getElementById("desconto-tipo").value || null;
        var valRaw = document.getElementById("desconto-valor").value;
        var val = parseFloat(String(valRaw).replace(",", ".")) || 0;
        var vo = valorOriginalOrcCompat(orcamentoAtual);
        var vf = tipo ? calcularValorFinalComDesconto(vo, tipo, val) : vo;
        var vDesc = tipo ? descontoEquivalenteEmReais(vo, tipo, val) : 0;

        var entrada = numeroInput("entrada");
        var restante = numeroInput("restante");

        return {
            desconto_tipo: tipo || null,
            desconto_valor: tipo ? val : null,
            valor_desconto: vDesc,
            valor_final: vf,
            valor_original: vo,
            total: vo,
            degustacao_data: strInput("degustacao-data") || null,
            degustacao_hora: strInput("degustacao-hora") || null,
            degustacao_obs: strInput("degustacao-obs") || null,
            forma_pagamento: strInput("forma-pagamento-adm") || null,
            forma_pagamento_ref: strInput("forma-pagamento-adm") || null,
            entrada: entrada,
            restante: restante,
            data_pagamento_entrada: strInput("data-pag-entrada") || null,
            data_pagamento_final: strInput("data-pag-final") || null
        };
    }

    function init() {
        if (!adminEstaAutenticado()) {
            window.location.href = "index.html";
            return;
        }
        var id = getQueryId();
        if (!id) {
            document.getElementById("admin-detalhe-erro").hidden = false;
            document.getElementById("admin-detalhe-erro").textContent = "Orçamento não informado.";
            document.getElementById("admin-detalhe-conteudo").hidden = true;
            return;
        }

        var o = getOrcamentoPorId(id);
        if (!o) {
            document.getElementById("admin-detalhe-erro").hidden = false;
            document.getElementById("admin-detalhe-erro").textContent = "Orçamento não encontrado.";
            document.getElementById("admin-detalhe-conteudo").hidden = true;
            return;
        }

        orcamentoAtual = o;
        document.getElementById("admin-detalhe-erro").hidden = true;
        document.getElementById("admin-detalhe-conteudo").hidden = false;
        renderOrcamento(o);

        document.getElementById("desconto-tipo").addEventListener("change", function () {
            atualizarPreviewFinal(orcamentoAtual);
        });
        document.getElementById("desconto-valor").addEventListener("input", function () {
            atualizarPreviewFinal(orcamentoAtual);
        });

        document.getElementById("btn-salvar").addEventListener("click", function () {
            var tipo = document.getElementById("desconto-tipo").value || null;
            var valRaw = document.getElementById("desconto-valor").value;
            var val = parseFloat(String(valRaw).replace(",", ".")) || 0;
            if (tipo && val <= 0) {
                alert("Informe um valor de desconto válido ou deixe o tipo em branco.");
                return;
            }
            var status = document.getElementById("status-orcamento").value;
            var patch = Object.assign(patchComumExtra(), { status: status });

            var atualizado = atualizarOrcamentoParcial(orcamentoAtual.id, patch);
            if (atualizado) {
                orcamentoAtual = atualizado;
                alert("Orçamento atualizado.");
                renderOrcamento(orcamentoAtual);
            }
        });

        document.getElementById("btn-whatsapp-orc").addEventListener("click", function () {
            var fresh = getOrcamentoPorId(orcamentoAtual.id);
            if (!fresh) return;
            var msg = montarWhatsAppDetalhe(fresh);
            var tel = (CONFIG && CONFIG.telefoneWhatsApp) ? CONFIG.telefoneWhatsApp : "5547999999999";
            window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(msg), "_blank");
        });

        document.getElementById("btn-pdf-orcamento").addEventListener("click", function () {
            var fresh = getOrcamentoPorId(orcamentoAtual.id);
            if (!fresh) return;
            Object.assign(fresh, patchComumExtra());
            gerarOrcamentoPropostaPDF(fresh);
        });

        document.getElementById("btn-contrato").addEventListener("click", function () {
            var oid = orcamentoAtual.id;
            var tipoC = document.getElementById("desconto-tipo").value || null;
            var valC = parseFloat(String(document.getElementById("desconto-valor").value).replace(",", ".")) || 0;
            if (tipoC && valC <= 0) {
                alert("Ajuste o desconto ou deixe sem desconto antes de gerar o contrato.");
                return;
            }
            var vo = valorOriginalOrcCompat(orcamentoAtual);
            var vf = tipoC ? calcularValorFinalComDesconto(vo, tipoC, valC) : vo;
            var stContrato = CONFIG.STATUS_ORCAMENTO && CONFIG.STATUS_ORCAMENTO.CONTRATO_GERADO;
            var extra = patchComumExtra();

            atualizarOrcamentoParcial(oid, Object.assign(extra, {
                desconto_tipo: tipoC || null,
                desconto_valor: tipoC ? valC : null,
                valor_final: vf,
                valor_desconto: tipoC ? descontoEquivalenteEmReais(vo, tipoC, valC) : 0,
                contrato: {
                    valor_final: vf,
                    data_contrato: new Date().toISOString(),
                    status: "emitido"
                },
                contrato_pdf: {
                    tipo: "contrato",
                    gerado_em: new Date().toISOString()
                },
                status: stContrato || "contrato_gerado"
            }));

            var fresh = getOrcamentoPorId(oid);
            if (!fresh) return;
            gerarContratoPDF(fresh);
            orcamentoAtual = fresh;
            renderOrcamento(orcamentoAtual);
            alert("Contrato PDF gerado.");
        });

        document.getElementById("btn-voltar").addEventListener("click", function () {
            window.location.href = "index.html";
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
