const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const precise = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function text(document, tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function checklistLabel(count) {
  return number.format(count) + (count === 1 ? " complete checklist" : " complete checklists");
}

function chartScale(maximum) {
  const target = Math.max(1, maximum / 4);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= target) * magnitude;
  const max = step * Math.max(1, Math.ceil(maximum / step));
  return { max, step };
}

function scaleHeader(document, scale) {
  const header = text(document, "th", "Expected distinct species");
  header.scope = "col";
  const axis = text(document, "div", "", "itinerary-axis");
  const count = Math.round(scale.max / scale.step);
  for (let index = 0; index <= count; index++) {
    const tick = text(document, "span", number.format(index * scale.step));
    tick.style.left = (100 * index / count) + "%";
    axis.append(tick);
  }
  axis.setAttribute("aria-hidden", "true");
  header.append(axis);
  return header;
}

function scoreCell(document, row, total, scale, previous = 0) {
  const cell = row.insertCell();
  cell.className = "itinerary-value";
  cell.append(text(document, "span", precise.format(total), "itinerary-value__number"));
  const track = text(document, "div", "", "itinerary-score");
  track.setAttribute("aria-hidden", "true");
  const fill = text(document, "span", "", "itinerary-score__previous");
  fill.style.width = 100 * previous / scale.max + "%";
  const added = text(document, "span", "", "itinerary-score__added");
  added.style.left = fill.style.width;
  added.style.width = 100 * (total - previous) / scale.max + "%";
  track.append(fill, added);
  cell.append(track);
}

function recommendationCard(document, recommendation, label, nextGain) {
  const element = text(document, "div", "", "itinerary-highlight");
  element.append(
    text(document, "h3", label),
    text(document, "strong", precise.format(recommendation.expectedSpecies), "itinerary-highlight__value"),
    text(document, "span", "expected distinct species"),
    text(document, "h4", recommendation.hotspots.length + (recommendation.hotspots.length === 1 ? " hotspot" : " hotspots"))
  );
  const sites = document.createElement("ul");
  for (const hotspot of recommendation.hotspots) {
    const item = text(document, "li", "");
    item.append(
      text(document, "span", hotspot.name),
      text(document, "small", checklistLabel(hotspot.complete))
    );
    sites.append(item);
  }
  element.append(sites);
  if (nextGain !== undefined) {
    element.append(text(document, "p", "Add one stop for about " + precise.format(nextGain) + " more species.", "itinerary-next-gain"));
  }
  return element;
}

function comparison(document, title, card, table, notes) {
  const layout = text(document, "div", "", "itinerary-results");
  const visual = text(document, "div", "", "itinerary-comparison");
  const chart = text(document, "div", "", "itinerary-table-scroll");
  chart.append(table);
  visual.append(text(document, "h3", title), chart);
  if (notes) visual.append(notes);
  layout.append(card, visual);
  return layout;
}

function chartTable(document, firstTitle, secondTitle, scale) {
  const table = document.createElement("table");
  const head = table.createTHead().insertRow();
  for (const title of [firstTitle, secondTitle]) {
    const column = text(document, "th", title);
    column.scope = "col";
    head.append(column);
  }
  head.append(scaleHeader(document, scale));
  return table;
}

export function renderCountyItineraries(document, plans, selectedStops) {
  const recommendation = plans[selectedStops - 1];
  const scale = chartScale(plans.at(-1).expectedSpecies);
  const table = chartTable(document, "Stops", "Hotspot added", scale);
  table.className = "itinerary-county-chart";
  const body = table.createTBody();
  plans.forEach((plan, index) => {
    const row = body.insertRow();
    const hotspot = plan.hotspots.at(-1);
    const previous = plans[index - 1]?.expectedSpecies ?? 0;
    row.classList.toggle("itinerary-selected", index + 1 === selectedStops);
    const stops = text(document, "th", String(index + 1));
    stops.scope = "row";
    if (index + 1 === selectedStops) stops.setAttribute("aria-current", "true");
    row.append(stops);
    const site = row.insertCell();
    site.append(text(document, "span", hotspot.name, "itinerary-site"),
      text(document, "span", "+" + precise.format(plan.expectedSpecies - previous) + " species", "itinerary-gain"));
    site.title = hotspot.name + " · " + checklistLabel(hotspot.complete);
    scoreCell(document, row, plan.expectedSpecies, scale, previous);
  });
  const next = plans[selectedStops];
  const note = text(document, "p", "", "itinerary-legend");
  for (const [label, color] of [["Earlier stops", "previous"], ["Added at this stop", "added"]]) {
    const key = text(document, "span", label, "itinerary-key itinerary-key--" + color);
    note.append(key);
  }
  note.append(text(document, "span", "Rows show selection order."));
  const card = recommendationCard(document, recommendation, selectedStops === 1 ? "Top hotspot" : "Suggested itinerary",
    next ? next.expectedSpecies - recommendation.expectedSpecies : undefined);
  return comparison(document, "What does another stop add?", card, table, note);
}

export function renderManualItineraries(document, ranked, selected, onSelect) {
  const scale = chartScale(ranked[0].expectedSpecies);
  const table = chartTable(document, "Rank", "Hotspots", scale);
  const body = table.createTBody();
  for (const [index, itinerary] of ranked.entries()) {
    const row = body.insertRow();
    const active = itinerary.key === selected.key;
    row.classList.toggle("itinerary-selected", active);
    const rank = text(document, "th", "");
    rank.scope = "row";
    const button = text(document, "button", String(index + 1), "itinerary-preview-button");
    button.type = "button";
    button.setAttribute("aria-label", "Preview combination " + (index + 1));
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", () => onSelect(itinerary.key));
    rank.append(button);
    row.append(rank);
    const sites = row.insertCell();
    const list = document.createElement("ul");
    for (const hotspot of itinerary.hotspots) {
      const item = text(document, "li", hotspot.name);
      item.title = checklistLabel(hotspot.complete);
      list.append(item);
    }
    sites.append(list);
    scoreCell(document, row, itinerary.expectedSpecies, scale);
  }
  const rank = ranked.indexOf(selected) + 1;
  const label = ranked.length === 1 ? "Selected itinerary"
    : rank === 1 ? "Highest-scoring itinerary" : "Combination " + rank + " preview";
  const card = recommendationCard(document, selected, label);
  return comparison(document, "Compare candidate itineraries", card, table);
}
