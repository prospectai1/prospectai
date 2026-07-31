/* ProspectAI — tiny dependency-free SVG chart helpers */

const Charts = {
  bar(data, opts) {
    // data: [{label, value}]
    opts = opts || {};
    const w = opts.width || 400, h = opts.height || 180, pad = 28;
    const max = Math.max(1, ...data.map(d => d.value));
    const barW = (w - pad*2) / data.length;
    const color = opts.color || "#6366f1";
    let bars = "", labels = "";
    data.forEach((d, i) => {
      const bh = (d.value / max) * (h - pad*2);
      const x = pad + i*barW + barW*0.15;
      const y = h - pad - bh;
      bars += `<rect x="${x}" y="${y}" width="${barW*0.7}" height="${bh}" rx="4" fill="${d.color || color}"><title>${d.label}: ${d.value}</title></rect>`;
      labels += `<text x="${x + barW*0.35}" y="${h-8}" font-size="9" fill="#6b7386" text-anchor="middle">${d.label}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${bars}${labels}</svg>`;
  },

  line(series, opts) {
    // series: [value,...]
    opts = opts || {};
    const w = opts.width || 400, h = opts.height || 140, pad = 14;
    const max = Math.max(...series, 1), min = Math.min(...series, 0);
    const range = (max - min) || 1;
    const stepX = (w - pad*2) / (series.length - 1 || 1);
    const pts = series.map((v,i) => {
      const x = pad + i*stepX;
      const y = h - pad - ((v - min)/range) * (h - pad*2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const color = opts.color || "#6366f1";
    const areaPts = `${pad},${h-pad} ${pts.join(" ")} ${pad + (series.length-1)*stepX},${h-pad}`;
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">
      <polygon points="${areaPts}" fill="${color}22" />
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  },

  donut(segments, opts) {
    // segments: [{label, value, color}]
    opts = opts || {};
    const size = opts.size || 150, stroke = opts.stroke || 16;
    const r = (size - stroke) / 2;
    const cx = size/2, cy = size/2;
    const total = segments.reduce((s,d) => s+d.value, 0) || 1;
    let offset = 0;
    const circumference = 2 * Math.PI * r;
    let circles = "";
    segments.forEach(seg => {
      const frac = seg.value / total;
      const dash = frac * circumference;
      circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})">
        <title>${seg.label}: ${seg.value}</title></circle>`;
      offset += dash;
    });
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${circles}</svg>`;
  },

  sparkline(series, opts) {
    opts = opts || { width: 90, height: 28, color: "#22c55e" };
    return this.line(series, opts);
  },
};
