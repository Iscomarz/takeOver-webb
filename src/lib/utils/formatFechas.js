 export function formatDiaYHora(dateString) {
    const diaYHora = new Date(dateString).toLocaleString("es-ES", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: true,
    });
    return diaYHora.replace(",", " / ").toUpperCase();
  }

  export function formatDate(dateString) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  }