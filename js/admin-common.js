/**
 * Autenticação simples da área administrativa (troque CONFIG.senhaAdmin)
 */
var ADMIN_SESSION_KEY = "admin_confeitaria_" + (typeof CONFIG !== "undefined" && CONFIG.nomeEmpresa
    ? CONFIG.nomeEmpresa.replace(/\s+/g, "_").toLowerCase()
    : "default");

function adminEstaAutenticado() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function adminLogin(senha) {
    if (typeof CONFIG !== "undefined" && senha === CONFIG.senhaAdmin) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
        return true;
    }
    return false;
}

function adminLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function formatarDataBR(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarMoeda(n) {
    var x = Number(n) || 0;
    return "R$ " + x.toFixed(2).replace(".", ",");
}
