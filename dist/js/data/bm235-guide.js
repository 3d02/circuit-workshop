// The complete BM235 guide: every function and feature, how it works, and
// expected uses, unexpected uses, and surprises. Specifications follow Brymen's
// current manual (2023) unless marked; "older units" means the 1000 V version
// documented in the EEVblog manual (17 August 2020). Independent measurements
// come from HKJ's review on lygte-info.dk and are attributed in the text.
// DOM-free so it can be checked by the tests.

// `panel` is the id of the matching entry on the field guide's front panel.
export const GROUPS = [
  { id: "meter", name: "The meter" },
  { id: "voltage", name: "Voltage and frequency" },
  { id: "small", name: "Millivolts and temperature" },
  { id: "resistance", name: "Resistance, continuity, diodes" },
  { id: "capacitance", name: "Capacitance" },
  { id: "current", name: "Current" },
  { id: "detect", name: "Detection" },
  { id: "features", name: "Buttons and features" },
  { id: "living", name: "Living with it" },
];

const RED_V = "V Ω jack";
const RED_MA = "mA µA jack";
const RED_A = "A jack (10 A)";

export const SECTIONS = [
  // ---------- the meter ----------
  {
    id: "glance",
    group: "meter",
    name: "At a glance",
    html: `<p>The BM235 is a handheld, 6000-count, true-RMS multimeter made by Brymen in Taiwan. It's sold under Brymen's own name and rebadged by others, most famously as the EEVblog BM235 with a blue holster. Compared with a typical cheap meter, it adds proper safety engineering: UL-certified CAT IV 300 V and CAT III 600 V ratings, ceramic HRC fuses and 6 kV surge protection. It also has a set of electrician's features: AutoV low-impedance voltage, VFD filtering and non-contact voltage detection.</p>`,
    table: {
      head: ["", ""],
      rows: [
        ["Display", "6000 counts (“3 5/6 digits”); 5 readings a second nominal (HKJ saw about 3)"],
        ["AC measurement", "true RMS on AC volts and AC current"],
        ["Safety", "IEC/UL/EN 61010-1, -2-033 and -031; CAT III 600 V and CAT IV 300 V (older units also CAT II 1000 V)"],
        ["Surge protection", "6 kV, 1.2/50 µs (lightning-style surge)"],
        ["Overload protection", "V and AutoV: 660 V DC, 1100 V AC RMS. mV, Ω and the rest: 600 V (1000 V on older units). Current inputs: 1000 V HRC fuses"],
        ["EMC", "EN 61326-1. In an RF field of 3 V/m, temperature is unspecified and resistance can be 15 digits worse"],
        ["Operating conditions", "−10 to 45 °C; up to 80% RH at 31 °C, falling to 50% at 45 °C; below 2000 m; indoors"],
        ["Storage", "−20 to 60 °C, under 80% RH, batteries removed"],
        ["Temperature coefficient", "add 0.15 × the accuracy spec per °C below 18 °C or above 28 °C"],
        ["Ingress protection", "IP40: keeps out fingers and tools, not dust or water"],
        ["Power", "2 × AAA; about 3.2 mA typical; battery symbol below about 2.5 V"],
        ["Size and weight", "161 × 80 × 50 mm and about 334 g, with holster"],
        ["Warranty", "1 year from Brymen, excluding fuses, batteries and accessories"],
      ],
    },
  },
  {
    id: "versions",
    group: "meter",
    name: "Models and versions",
    html: `<p>Brymen's manual covers three models. The BM235 is the top one:</p>`,
    table: {
      head: ["", "BM231", "BM233", "BM235"],
      rows: [
        ["AutoV (LoZ)", "–", "–", "✓"],
        ["Temperature (type K)", "–", "–", "✓"],
        ["Capacitance", "–", "✓", "✓"],
        ["Frequency (Hz)", "–", "✓", "✓"],
        ["V, VFD, mV, Ω, continuity, diode, µA/mA/A, EF, REC, Δ, HOLD, backlight", "✓", "✓", "✓"],
      ],
    },
    after: `<p>There are also two generations of the BM235. <strong>Earlier units</strong>, including the EEVblog edition, are rated CAT II 1000 V as well as CAT III 600 V and CAT IV 300 V, have a 1000 V range on V, VFD and AutoV, and protect the mV and Ω inputs to 1000 V. <strong>Current units</strong>, per Brymen's 2023 manual, stop at 600 V, are rated CAT III 600 V and CAT IV 300 V, and protect mV and Ω to 600 V. The label beside the COM jack tells you which you have. Where they differ, this guide gives the current figure and mentions the older one.</p>`,
  },
  {
    id: "display",
    group: "meter",
    name: "Reading the display",
    html: `<p>What the symbols and messages mean:</p>`,
    table: {
      head: ["You see", "It means"],
      rows: [
        ["AUTO", "auto-ranging is on. It disappears when you lock a range with RANGE"],
        ["~ / ⎓", "AC / DC. Check it every time: each dial position comes back in whatever you selected last"],
        ["VFD", "the low-pass filtered AC mode (and filtered Hz)"],
        ["LoZ, Auto", "AutoV is active: low input impedance, and the meter is choosing AC or DC for you"],
        ["- - - -", "AutoV is ready and sees less than about 1 V"],
        ["MAX, MIN, AVG", "MAX/MIN recording is running; the lit word shows which value you're looking at"],
        ["H", "display hold"],
        ["Δ", "relative mode: readings are shown as a difference from a stored reference"],
        ["•)))", "continuity mode"],
        ["diod", "shown when you select the diode test"],
        ["OL / −OL", "over range, positive or negative (−OL needs firmware F or later)"],
        ["InEr", "a lead is in a current jack while the dial is on another function. With no leads in, see Troubleshooting"],
        ["EF-H / EF-L and bars", "EF detection, high or low sensitivity; more bars, stronger field"],
        ["battery symbol", "the batteries are below about 2.5 V: replace them"],
      ],
    },
  },
  {
    id: "buttons",
    group: "meter",
    name: "Buttons: short and long presses",
    html: `<p>Every button does something different on a short press and on a press of a second or more.</p>`,
    table: {
      head: ["Button", "Press", "Hold for 1 s", "Notes"],
      rows: [
        ["SELECT", "next function at this dial position", "backlight on/off", "also wakes the meter from auto power-off"],
        ["RANGE", "lock the range; again for the next range", "back to auto-ranging", "with Hz: trigger level. With EF: EF-H or EF-L (the “Level” label)"],
        ["REC", "start MAX/MIN/AVG; then step MAX → MIN → AVG", "stop recording", "auto power-off is disabled while recording"],
        ["HOLD", "freeze or release the display", "relative mode (Δ) on or off", "hold it while switching on to see the firmware letter"],
        ["Hz", "frequency on or off", "–", "in the V, mV and current positions"],
        ["EF", "EF detection on or off", "–", "works in AutoV too"],
      ],
    },
  },

  // ---------- voltage ----------
  {
    id: "autov",
    group: "voltage",
    panel: "autov",
    name: "AutoV (LoZ)",
    setup: { dial: "Auto V LoZ", select: "none: SELECT only toggles the backlight here", red: RED_V },
    specs: [
      ["Range", "600.0 V AC or DC, chosen automatically (1000 V on older units)"],
      ["Threshold", "about 1 V. Below it the display shows “- - - -”"],
      ["Accuracy", "±(2.0% + 3 d), 45–440 Hz; not specified below 1 V"],
      ["Impedance, from rest", "AC: over 8 MΩ below 5.6 V, 22 kΩ at 7 V, 12 kΩ at 8 V, 2.6 kΩ at 50 V. DC: over 8 MΩ below 8 V, 25 kΩ at 9 V, 13 kΩ at 10 V, 2.6 kΩ at 50 V"],
      ["Impedance, on a high voltage", "about 2.1 kΩ at first, settling within a fraction of a second at 12 kΩ (100 V), 100 kΩ (300 V), 240 kΩ (600 V), 580 kΩ (1000 V, older units)"],
      ["Peak load current", "up to 404 mA at first on 600 V AC (673 mA on 1000 V, older units); about 155 mA on 230 V mains"],
      ["Buttons", "HOLD, EF and backlight only"],
    ],
    how: `<p>AutoV puts a deliberate load across the probes. A real supply hardly notices a couple of kilohms, but a <strong>ghost voltage</strong>, picked up by a disconnected wire through its capacitance to live wires nearby, comes from an enormous source impedance and collapses. That's how AutoV tells a live wire from a dead one that merely sits next to live ones.</p>
      <p>The load protects itself: on a high voltage its impedance rises within a fraction of a second, and the settled figures in the manual work out at about a watt (100 V across 12 kΩ is 0.8 W, 300 V across 100 kΩ is 0.9 W). That's the behaviour of something that heats up and limits itself. HKJ's teardown found a pair of PTC thermistors and three varistors on the input board. Below about 8 V DC or 6 V AC the input is over 8 MΩ, so AutoV hardly loads the circuit.</p>
      <p>The meter shows whichever of AC or DC is larger at its peak, and shows nothing until it has decided (HKJ).</p>`,
    expected: [
      "Checking sockets, switches and fused spurs",
      "Proving a circuit dead before work: prove on a known live source, test, prove again",
      "Measurements in a fuse board or distribution board, within the CAT III 600 V / CAT IV 300 V ratings",
      "Telling a live wire from a disconnected one in the same cable",
    ],
    unexpected: [
      "<strong>Discharging capacitors</strong>, a tip from Dave Jones in the EEVblog manual: AutoV drains a charged capacitor down to about 8 V while showing its voltage. The field guide has a calculator for how long it takes.",
      "<strong>Seeing through leaky switches.</strong> An illuminated or smart switch passes a trickle of current even when off, so a lamp holder can read 100 V or more on the 10 MΩ input. In AutoV it collapses to a few volts.",
      "<strong>Is it a real supply?</strong> Measure on V, then on AutoV. If the reading collapses, it's coupling or leakage, not a source that can deliver power.",
      "<strong>AC or DC?</strong> Identify an unknown low-voltage adapter or transformer without guessing which mode to use.",
    ],
    traps: [
      "Measuring live to earth sends the load current down the earth wire, which can trip an RCD. Use V for that pair if it does.",
      "Never on electronics, sensor or signal wiring: a couple of kilohms is a heavy load for those circuits.",
      "Below about 8 V DC the input is high impedance again, so a dead wire can still show a few volts. That's normal; mains-level readings are what matter.",
      "No Hz, manual ranging, MAX/MIN or relative mode in this position.",
      "Firmware before revision d could drop the decimal point and the minus sign when using HOLD in AutoV. Check your firmware letter.",
    ],
  },
  {
    id: "acv",
    group: "voltage",
    panel: "v",
    name: "AC volts",
    setup: { dial: "V", select: "until the display shows ~", red: RED_V },
    specs: [
      ["Ranges", "6.000 V, 60.00 V, 600.0 V (older units add 1000 V); resolution 1 mV, 10 mV, 0.1 V"],
      ["Accuracy", "±(0.7% + 3 d) at 50–60 Hz; ±(2.0% + 3 d) from 45 to 440 Hz; specified from 1% to 100% of range"],
      ["Crest factor", "under 2 at full scale, under 4 at half scale"],
      ["Input", "10 MΩ in parallel with 54 pF"],
      ["Measured bandwidth", "1 V AC reads 5% low at 1.6 kHz (HKJ)"],
    ],
    how: `<p>A 10 MΩ divider scales the voltage, and Brymen's own measurement chip calculates the true RMS value: the DC voltage that would heat a resistor equally. Distorted waveforms from dimmers, UPSs, modified-sine inverters and electronic loads therefore read correctly. There's no separate RMS converter chip, so, as Dave Jones notes, “true RMS” here doesn't mean “high frequency”: the specification stops at 440 Hz.</p>`,
    expected: ["Mains sockets and appliances (CAT II/III)", "Transformers, doorbells, garden lighting", "Generators and inverters, including modified-sine ones"],
    unexpected: [
      "<strong>Amplifier power</strong>: play a test tone below 400 Hz into a dummy load resistor and measure across it. P = V² ÷ R.",
      "<strong>Generator health</strong>: watch the voltage as you load a portable generator. A good governor and regulator hold it steady.",
    ],
    traps: [
      "Audio above about 1 kHz reads low: it's outside the bandwidth.",
      "Below 1% of the range (under 60 mV on the 6 V range) the reading isn't specified.",
      "With the backlight on, up to 5 digits of non-zero residue can appear on the 6 V AC range. It doesn't affect readings above that.",
      "AC with a large DC offset can fool auto-ranging into reading low. Choose the range manually, starting high (EEVblog manual).",
      "On 10 MΩ, disconnected wires near live ones show ghost voltages. Check suspicious readings in AutoV.",
    ],
  },
  {
    id: "dcv",
    group: "voltage",
    panel: "v",
    name: "DC volts",
    setup: { dial: "V", select: "until the display shows ⎓", red: RED_V },
    specs: [
      ["Ranges", "6.000 V, 60.00 V, 600.0 V (older units add 1000 V)"],
      ["Accuracy", "±(0.3% + 2 d) on 6 V, ±(0.4% + 2 d) on 60 V, ±(0.2% + 2 d) on 600 V (older 1000 V range: ±(0.4% + 2 d))"],
      ["Input", "10 MΩ in parallel with 54 pF"],
      ["Polarity", "shows a minus sign when red is below black; −OL for a negative overload (firmware F or later)"],
    ],
    how: `<p>The input is the 10 MΩ divider HKJ found on the main board. Auto-ranging picks the tap that keeps the reading under 6000 counts with the most digits, and the converter measures the result about five times a second.</p>`,
    expected: ["Batteries, chargers and power supplies", "Electronics and car electrics", "Solar panels and battery banks"],
    unexpected: [
      "<strong>The voltage-drop walk</strong>: with a 12 V circuit switched on and working, keep black on battery negative and step red from the battery's + towards the load. The point where the voltage steps down is the bad joint.",
      "<strong>Battery internal resistance</strong>: measure the voltage with no load and under a known load current. R = (V<sub>open</sub> − V<sub>load</sub>) ÷ I.",
      "<strong>0–10 V control signals</strong> for LED dimmers, ventilation and heating controls.",
      "<strong>Polarity finding</strong>: the minus sign tells you which wire is positive without a diagram.",
    ],
    traps: [
      "10 MΩ loads high-impedance circuits: the middle of two 1 MΩ resistors reads about 5% low.",
      "With the probes in the air the digits wander. That's normal for a high-impedance input.",
      "Long disconnected wires near mains can show ghost voltages.",
    ],
  },
  {
    id: "vfd",
    group: "voltage",
    panel: "v",
    name: "VFD AC volts",
    setup: { dial: "V", select: "until the display shows VFD", red: RED_V },
    specs: [
      ["Range", "600.0 V only (and 1000 V on older units)"],
      ["Accuracy", "±(1.0% + 3 d) for a 10–100 Hz fundamental, worsening linearly to ±(10% + 3 d) at 400 Hz; not specified above 400 Hz"],
      ["Measured", "rolls off at about 260 Hz (HKJ)"],
    ],
    how: `<p>A variable-frequency drive makes a motor's AC by switching its DC bus on and off thousands of times a second. An ordinary true-RMS meter sees all that switching and reads high and unsteadily. VFD mode passes the signal through a digital low-pass filter, so you see the voltage of the fundamental, the part that actually turns the motor. Hz in this mode is filtered too.</p>`,
    expected: ["Motor-drive outputs on pumps, fans, heat pumps and machine tools (professional work)"],
    unexpected: ["<strong>Steadier mains readings</strong> in electrically noisy places, as Brymen's manual suggests", "<strong>Filtered frequency</strong> of a noisy waveform, by pressing Hz in VFD mode"],
    traps: [
      "It's locked to the 600 V range, so resolution is 0.1 V and the error is at least ±0.3 V: poor for small voltages.",
      "It deliberately ignores harmonics, so it isn't the full RMS value. On genuine higher-frequency AC it reads low.",
    ],
  },
  {
    id: "hz",
    group: "voltage",
    panel: "hz",
    name: "Frequency (Hz)",
    setup: { dial: "V, mV, µA or A mA", select: "measure first, then press Hz", red: "the jack for the quantity you're measuring" },
    specs: [
      ["Accuracy", "±(0.03% + 2 d)"],
      ["Guaranteed range and trigger level (sine)", "mV ranges: 50 mV, 10 Hz–50 kHz. 6 V: 5 V, 10 Hz–50 kHz. 60 V: 10 V, 10 Hz–50 kHz. 600 V and VFD: 50 V, 10 Hz–1 kHz. µA and mA: 10 Hz–5 kHz. A: 50 Hz–1 kHz"],
      ["Measured", "2 Hz–330 kHz at 1 V RMS and 3 Hz–270 kHz at 0.1 V RMS, provided the signal crosses zero (HKJ)"],
    ],
    how: `<p>The meter compares the signal with a trigger level and counts the crossings. The trigger level follows the range: when you press Hz in a voltage function, the display briefly shows which trigger range it chose, and RANGE changes it. If the reading jumps about, choose a less sensitive range; if it shows zero, choose a more sensitive one.</p>`,
    expected: ["Mains frequency: 50 Hz (60 Hz in the Americas)", "Motor-drive output frequency, using VFD Hz"],
    unexpected: [
      "<strong>Generator governor check</strong>: a portable generator should hold close to 50 Hz both unloaded and loaded. A big drop under load means a tired governor.",
      "<strong>Signal generators and oscillators</strong>: on clean signals the counter works far beyond its specification, as HKJ's tests show.",
    ],
    traps: [
      "It needs a signal that crosses zero (HKJ). A 0–5 V logic or PWM signal can read zero.",
      "Not available in AutoV. Switch to V first.",
      "On current ranges RANGE doesn't change the trigger level.",
      "There's no duty-cycle function.",
    ],
  },

  // ---------- small signals ----------
  {
    id: "dcmv",
    group: "small",
    panel: "mv",
    name: "DC millivolts",
    setup: { dial: "mV", select: "until the display shows ⎓ mV", red: RED_V },
    specs: [
      ["Ranges", "60.00 mV and 600.0 mV; 10 µV resolution"],
      ["Accuracy", "±(0.3% + 2 d)"],
      ["Input", "10 MΩ; protected to 600 V (1000 V on older units)"],
      ["Measured", "the input resistance drops above about 2 V: 50 kΩ at 8 V, 4 kΩ at 30 V (HKJ)"],
    ],
    how: `<p>The mV ranges skip the divider, so the converter sees the input directly with 10 µV resolution. The input protection only starts conducting above a couple of volts, which is why the input stops being 10 MΩ there.</p>`,
    expected: ["Shunt resistors and current sensors", "Sensor outputs: load cells, thermopiles, raw thermocouple voltage", "Voltage drop across contacts, fuses, cables and connectors"],
    unexpected: [
      "<strong>Hundreds of amps, through an existing shunt</strong>: battery monitors and solar systems often use a shunt such as 100 A / 75 mV. Read the millivolts and scale (0.75 mV per amp here), well past the meter's own 10 A limit and without breaking the circuit.",
      "<strong>Hidden current through fuses</strong>: the millivolt drop across a blade fuse shows whether current flows through it (field guide: car battery drain).",
      "<strong>Contact quality under load</strong>: a good switch, relay contact or crimp drops a few mV at working current; a bad one drops tens or hundreds.",
    ],
    traps: [
      "Not for volts: above about 2 V the protection conducts and loads the circuit (HKJ), so the reading is wrong. Use V.",
      "Touching dissimilar metals makes tens of microvolts (thermal EMF). Short the probes and zero with Δ before measuring tiny voltages.",
      "Long leads pick up noise at 10 µV resolution.",
    ],
  },
  {
    id: "acmv",
    group: "small",
    panel: "mv",
    name: "AC millivolts",
    setup: { dial: "mV", select: "until the display shows ~ mV", red: RED_V },
    specs: [
      ["Ranges", "60.00 mV and 600.0 mV"],
      ["Accuracy", "±(1.0% + 3 d) at 10–500 Hz; ±(2.0% + 3 d) at 500–800 Hz"],
      ["Signal limits", "peaks, including any DC, under 130 mV on 60 mV and 1.3 V on 600 mV"],
      ["Input", "10 MΩ in parallel with 54 pF"],
    ],
    how: `<p>This is the same direct path as DC mV, through the true-RMS calculation.</p>`,
    expected: ["Small AC signals, sensor coils, ripple"],
    unexpected: ["<strong>Make it a clamp meter</strong>: an AC current clamp adapter with a millivolt output (often 1 mV per amp) plugs into V and COM, and the AC mV range reads amps directly. A Hall-effect adapter does the same for DC on the DC mV range."],
    traps: ["A DC bias counts towards the peak limit.", "With the backlight on, up to 5 digits of residue can appear on the 60 mV range."],
  },
  {
    id: "temp",
    group: "small",
    panel: "mv",
    name: "Temperature",
    setup: { dial: "mV", select: "until the display shows °C (or °F)", red: "BKP60 probe: + to V, − to COM", black: "" },
    specs: [
      ["Range", "−40.0 to 99.9 °C in 0.1 °C steps, 100 to 400 °C in 1 °C steps (−40 to 752 °F)"],
      ["Accuracy", "±(1% + 1 °C), or ±(1% + 2 °F), not including the probe"],
      ["Probe", "BKP60 type-K bead with a single two-pin plug; sold as good to about 250 °C. The optional BKB32 adapter takes standard mini type-K plugs"],
      ["Settling", "the meter must be at the same temperature inside and out: up to an hour after a change of more than 5 °C"],
    ],
    how: `<p>A type-K thermocouple is a junction of two alloys, chromel and alumel. It makes about 41 µV for every °C of difference between its tip and the meter's sockets. The meter measures that voltage on its mV circuit, adds the sockets' own temperature measured by a sensor inside (the cold junction), and shows the tip temperature. That's why the meter itself must have settled to room temperature.</p>`,
    expected: ["Air, liquids and surfaces", "Fridges, freezers, radiators and hot water", "Heating flow and return pipes"],
    unexpected: [
      "<strong>A room thermometer with no probe</strong>: on most thermocouple meters, shorting V to COM with a wire makes the display show the meter's own cold-junction temperature. Let it settle first.",
      "<strong>Soldering irons and ovens</strong> with a high-temperature type-K probe through the BKB32 adapter. The bead probe isn't rated that high.",
      "<strong>Checking an NTC sensor</strong>: measure its resistance and the temperature right beside it, then compare with its table.",
      "<strong>Heatsinks and power parts</strong> on low-voltage circuits: how hot does that regulator really get? Use MAX.",
    ],
    traps: [
      "Moving between rooms or out of a car skews readings until the meter settles.",
      "Brymen's figure excludes the probe's own tolerance.",
      "Readings aren't specified near a strong radio transmitter, including a phone held against the meter.",
      "Surface readings run low without good contact: tape the bead down, use a little thermal paste, and cover it.",
      "The thermocouple wire isn't insulated for mains: never let it touch live parts.",
    ],
  },

  // ---------- resistance ----------
  {
    id: "ohm",
    group: "resistance",
    panel: "ohm",
    name: "Resistance",
    setup: { dial: "Ω", select: "until the display shows Ω", red: RED_V },
    specs: [
      ["Ranges", "600.0 Ω, 6.000 kΩ, 60.00 kΩ, 600.0 kΩ, 6.000 MΩ, 60.00 MΩ"],
      ["Accuracy", "±(0.3% + 3 d) to 6 kΩ; ±(0.5% + 3 d) to 600 kΩ; ±(0.9% + 2 d) on the MΩ ranges; ±(5% + 20 d) above 30 MΩ"],
      ["Test signal", "about 1.6 V open circuit (HKJ: 1.8 V, 0.16 mA into a short); 0.2 µA on 6 MΩ, 0.02 µA on 60 MΩ"],
      ["Speed", "about 0.8 s for 100 Ω (HKJ)"],
      ["Leads", "27 mΩ per probe (HKJ)"],
    ],
    how: `<p>The meter drives a known, constant current from its own batteries through the part and measures the voltage across it: R = V ÷ I. Higher ranges use smaller currents, which is why megohm readings settle slowly and pick up hum and finger contact.</p>`,
    expected: ["Resistors, heating elements, windings", "Sensors and potentiometers", "Checking an appliance's earth path from the plug pin to the metal case (a quick indication, not a formal appliance test)"],
    unexpected: [
      "<strong>Identifying compressor terminals</strong> (common, start, run) on a fridge or air-conditioner compressor, unplugged: measure all three pairs. The largest reading is start–run, and the terminal shared by the two smaller readings is common.",
      "<strong>Speakers</strong>: an 8 Ω speaker reads about 6–7 Ω DC. OL means an open voice coil.",
      "<strong>A light meter from an LDR</strong>: its resistance falls from around a megohm in the dark to a few kilohms or less in daylight.",
    ],
    traps: [
      "Never on live circuits.",
      "In a circuit, parallel paths read low. The 1.6 V test voltage is enough to turn on silicon junctions, so diodes and transistors join in.",
      "For low values, short the probes and hold HOLD for a second (Δ) to remove the leads' 0.05 Ω or so.",
      "On the MΩ ranges, touching both probes adds your body in parallel.",
      "Big capacitors and inductors make the reading creep before it settles.",
    ],
  },
  {
    id: "cont",
    group: "resistance",
    panel: "ohm",
    name: "Continuity (BeepLit)",
    setup: { dial: "Ω", select: "until the display shows •)))", red: RED_V },
    specs: [
      ["Threshold", "beeps below somewhere between 30 and 480 Ω (HKJ's sample: 161 Ω)"],
      ["Response", "under 15 ms (HKJ: about 20 ms)"],
      ["Indication", "continuous beep plus a flashing backlight"],
      ["Test signal", "about 1.7 V open, 0.16 mA into a short (HKJ)"],
    ],
    how: `<p>This uses the resistance circuit with a fast comparator in place of the full measurement. Brymen calls the beep-plus-flash “BeepLit”: you can hear it, or see it when you're wearing ear defenders or working somewhere loud. Forum users describe the beep as latching, so even a very brief contact makes an audible chirp.</p>`,
    expected: ["Wires, fuses, switches and PCB tracks", "Mapping cables and finding broken conductors"],
    unexpected: [
      "<strong>Chasing intermittent faults</strong>: leave the probes on and flex the cable or tap the joint. A break that comes and goes shows up as a stutter.",
      "<strong>Mapping a multicore cable alone</strong>: twist two cores together at the far end, then find the pair that beeps at your end.",
      "<strong>Switch timing by eye</strong>: watch the backlight flash as you work a limit switch or thermostat.",
    ],
    traps: [
      "A beep only means “below the threshold”. A joint that beeps can still fail at 10 A, and a 100 Ω part beeps too.",
      "Never on live circuits.",
    ],
  },
  {
    id: "diode",
    group: "resistance",
    panel: "capdiode",
    name: "Diode test",
    setup: { dial: "Cap ▶| (capacitor and diode symbols)", select: "until the display shows diod", red: "V Ω jack, to the anode" },
    specs: [
      ["Range", "3.000 V, ±(0.9% + 2 d)"],
      ["Test signal", "about 0.3 mA (HKJ: 0.33 mA into a short); under 3.2 V open circuit"],
      ["Reading a diode", "good silicon: 0.4–0.9 V forward, OL reversed. 0 V both ways: shorted. OL both ways: open"],
    ],
    how: `<p>The meter pushes about 0.3 mA through the part and shows the voltage across it, which is the junction's forward voltage at that current. Anything needing more than 3.0 V reads OL.</p>`,
    expected: ["Diodes and bridge rectifiers", "LEDs: most glow faintly, and the reading is their forward voltage", "Transistor junctions"],
    unexpected: [
      "<strong>Identifying an unknown bipolar transistor</strong>: find the pin that conducts to both others. That's the base; red on it means NPN, black on it means PNP. Base–emitter reads slightly higher than base–collector.",
      "<strong>Checking a MOSFET</strong>: the body diode reads about 0.5 V from source to drain. Touch the gate with the red probe to charge it, and a logic-level part will then conduct drain to source. 3.2 V is too little for standard MOSFETs.",
      "<strong>Binning LEDs</strong>: zero on one with Δ, then read the others as differences.",
      "<strong>A diode thermometer</strong>: the forward voltage falls by about 2 mV per °C. Warm the diode in your fingers and watch.",
    ],
    traps: [
      "Blue and white LEDs need nearly all of the 3.2 V and may read OL.",
      "LED strips and anything with LEDs in series read OL.",
      "Schottky diodes read 0.15–0.45 V. That's normal for them, not leakage.",
      "Zener diodes only show their breakdown if it's under 3 V.",
    ],
  },

  // ---------- capacitance ----------
  {
    id: "cap",
    group: "capacitance",
    panel: "capdiode",
    name: "Capacitance",
    setup: { dial: "Cap ▶| (capacitor and diode symbols)", select: "until the display shows a farad unit", red: "V Ω jack, to the + of an electrolytic" },
    specs: [
      ["Ranges", "20.00 nF, 200.0 nF, 2000 nF, 20.00 µF, 200.0 µF, 2000 µF, 10.00 mF; auto-ranging only"],
      ["Accuracy", "±(1.5% + 8 d) on the two lowest ranges; ±(1.5% + 2 d) to 2000 µF; ±(4.5% + 10 d) on 10 mF (specified with film capacitors)"],
      ["Speed", "about 7 s for 1000 µF, with a first estimate at about 3 s (HKJ)"],
      ["Test waveform", "charges both ways around zero (HKJ)"],
    ],
    how: `<p>The meter charges and discharges the capacitor with a known current and times how long the voltage takes to change: C = I × t ÷ V. Large capacitors take longer, so the meter slows down on the higher ranges.</p>`,
    expected: ["Motor run and start capacitors", "Electrolytic, film and ceramic capacitors", "Identifying unmarked parts"],
    unexpected: [
      "<strong>Measuring cable length</strong>: a cable has a fairly constant capacitance per metre between its conductors, roughly 50–100 pF/m depending on the type. Measure a known length of the same cable to calibrate, then any length of it.",
      "<strong>Finding a break</strong>: measure the broken conductor from both ends. The ratio of the two readings tells you how far along the break is.",
    ],
    traps: [
      "Discharge first, using AutoV and then a resistor, and measure out of circuit.",
      "Capacitance isn't health: a capacitor with the right µF can still have high ESR and fail in a power supply. This meter can't measure ESR.",
      "Ceramic capacitors (X7R, Y5V) lose much of their capacitance with DC bias and temperature, so a low reading off-circuit isn't the whole story.",
      "On small values, zero the leads' capacitance first with Δ, probes apart.",
    ],
  },

  // ---------- current ----------
  {
    id: "ua",
    group: "current",
    panel: "ua",
    name: "Microamps",
    setup: { dial: "µA", select: "until the display shows ⎓ or ~", red: RED_MA },
    specs: [
      ["Ranges", "600.0 µA and 6000 µA; 0.1 µA resolution"],
      ["Accuracy", "DC ±(1.0% + 3 d); AC ±(1.5% + 3 d) at 50–400 Hz"],
      ["Burden", "0.1 mV per µA: a 100 Ω shunt (R33 in HKJ's teardown)"],
      ["Protection", "400 mA / 1000 V HRC fuse plus five large protection diodes (HKJ)"],
    ],
    how: `<p>The current passes through a 100 Ω shunt, and the meter measures the voltage across it. A big shunt makes tiny currents measurable, but it also drops 0.6 V at the top of the 6000 µA range.</p>`,
    expected: ["Sleep and standby currents of battery gadgets", "Leakage", "Boiler flame-rod current, for gas engineers: Brymen gives at least 2 µA for a rectification sensor and 1.5 µA for a UV one"],
    unexpected: [
      "<strong>A light meter</strong>: a photodiode, or a small solar cell in dim light, connected straight to the µA input gives a current proportional to the light falling on it.",
      "<strong>Vampire drain</strong>: does a gadget that's “off” still drain its batteries? Battery life ≈ capacity ÷ current.",
    ],
    traps: [
      "When a sleeping gadget wakes it may draw milliamps, and 100 Ω then drops enough voltage to reset it. If it keeps rebooting, use the mA range.",
      "In series only, never across a supply.",
    ],
  },
  {
    id: "ma",
    group: "current",
    panel: "amA",
    name: "Milliamps",
    setup: { dial: "A mA", select: "until the display shows ⎓ or ~", red: RED_MA },
    specs: [
      ["Ranges", "60.00 mA and 600.0 mA"],
      ["Accuracy", "DC ±(0.7% + 3 d); AC ±(1.0% + 3 d) at 50–400 Hz"],
      ["Burden", "1.9 mV per mA (1.9 Ω)"],
      ["Fuse", "400 mA / 1000 V HRC, 6 × 32 mm; the input is rated to 600 mA, and Dave Jones notes the fuse handles 600 mA for a while"],
    ],
    how: `<p>One dial position serves both mA and A, and the jack you use picks which. In the mA µA jack the meter switches between two shunts. The burden is significant: a 500 mA load loses 0.95 V, which can starve a 3.3 V circuit. The field guide has a burden calculator.</p>`,
    expected: ["LED and gadget currents", "Battery chargers, on the low-voltage side"],
    unexpected: [
      "<strong>4–20 mA sensor loops</strong> in heating, solar and pool controls: at 20 mA the burden is only 38 mV, so you can break into a loop and read the sensor directly.",
      "<strong>LED strip power</strong>: measure the current of a strip segment, multiply by the voltage, and you know what size of supply it needs.",
    ],
    traps: [
      "Burden voltage. HKJ singles out the high mA range as poor; the A jack drops far less.",
      "Moving between the mA and A jacks breaks the circuit.",
      "Running above 400 mA for long overheats the fuse.",
    ],
  },
  {
    id: "amps",
    group: "current",
    panel: "amA",
    name: "Amps",
    setup: { dial: "A mA", select: "until the display shows ⎓ or ~", red: RED_A },
    specs: [
      ["Ranges", "6.000 A and 10.00 A"],
      ["Accuracy", "DC ±(0.7% + 3 d); AC ±(1.0% + 3 d) at 50–400 Hz"],
      ["Burden", "40 mV per A (40 mΩ)"],
      ["Limits", "10 A continuously; over 10 A and up to 20 A for 30 s at most, then 5 minutes to cool"],
      ["Fuse", "11 A / 1000 V HRC, 10 × 38 mm, 20 kA breaking capacity"],
    ],
    how: `<p>A low-value shunt carries up to 10 A continuously. It warms up at high current, which is why the 20 A rating has a time limit and a cooling period.</p>`,
    expected: ["Parasitic drain on a car (A jack, DC)", "12 V loads, motors and chargers"],
    unexpected: [
      "<strong>Solar panel check</strong>: a small 12 V panel's short-circuit current (within 10 A) compared with its label shows whether it's degraded. Connect it with the panel covered, then uncover it, and cover it again before disconnecting.",
    ],
    traps: [
      "Never across a battery or socket: in current mode the meter is a 40 mΩ short.",
      "Starting a car with the meter in a battery lead blows the fuse.",
      "For the current drawn by mains appliances, a clamp meter or plug-in energy meter is the safe tool.",
    ],
  },

  // ---------- detection ----------
  {
    id: "ef",
    group: "detect",
    panel: "ef",
    name: "EF: non-contact voltage",
    setup: { dial: "most positions, including AutoV", select: "press EF; RANGE switches EF-H and EF-L", red: "none needed", black: "" },
    specs: [
      ["EF-H, 1 to 5 bars", "about 10, 20, 40, 80 and 160 V or more"],
      ["EF-L, 1 to 5 bars", "about 40, 80, 160, 300 and 500 V or more"],
      ["Detects", "50/60 Hz fields; antenna at the top-left end of the meter"],
      ["Indication", "bars plus a beep that rises in pitch with field strength"],
    ],
    how: `<p>A conductor at mains voltage is surrounded by an alternating electric field. The antenna and the meter's circuit, referenced to you through your hand, form a tiny capacitor with the wire, and the meter amplifies the current that flows through it. It responds to voltage, not current: a lamp flex shows a field with the lamp switched off.</p>`,
    expected: ["Is this socket, cable or appliance live?", "Tracing where a live cable runs", "Telling live from neutral"],
    unexpected: [
      "<strong>Which breaker is it?</strong> Hold the meter near a flex plugged into the socket and switch breakers off one at a time until the beeping stops.",
      "<strong>Breaks in flexes and fairy lights</strong>: the field fades where the live conductor is broken.",
      "<strong>Which way round is a lamp's switch?</strong> With reversible plugs, compare the field at the bulb holder with the lamp off, plug one way and then the other.",
    ],
    traps: [
      "Silence never proves dead: DC, screened or armoured cable, metal conduit, wires deep in a wall, or a meter held in an insulated glove can all show nothing.",
      "Static, nearby cables and the way you hold the meter all affect sensitivity, and can give false alarms.",
    ],
  },
  {
    id: "efprobe",
    group: "detect",
    panel: "ef",
    name: "EF: single-probe contact",
    setup: { dial: "most positions", select: "press EF", red: "one lead only, in COM (most sensitive) or V", black: "" },
    specs: [["Use", "touch one conductor with the single probe; the bars show the field on that conductor"]],
    how: `<p>Instead of the antenna, the probe connects the detector directly to one conductor. That's far more selective than holding the meter near a bundle of wires, and needs no second probe or earth reference.</p>`,
    expected: ["Telling live from neutral at a socket or switch terminal"],
    unexpected: ["<strong>Finding the switched live</strong> among several conductors in a back box, one terminal at a time (only if you're competent to work there)"],
    traps: ["It's still detection, not measurement, and still not proof of dead."],
  },

  // ---------- features ----------
  {
    id: "rec",
    group: "features",
    panel: "rec",
    name: "MAX / MIN / AVG recording",
    setup: { dial: "most measuring positions", select: "press REC; press again to step MAX → MIN → AVG; hold to stop" },
    specs: [
      ["Behaviour", "beeps at each new maximum or minimum; auto-ranging continues; auto power-off is disabled"],
      ["AVG", "a rolling average of the last 16 readings, restarted when the input jumps by more than 16 counts (EEVblog manual)"],
      ["Speed", "a change needs to last about 310 ms to be captured (HKJ)"],
    ],
    how: `<p>The meter compares every new reading with the stored extremes. Because it only takes about five readings a second, it's a monitor for slow changes, not a peak catcher.</p>`,
    expected: ["Overnight temperature in a fridge or freezer (read MAX and MIN)", "Lowest battery voltage while cranking", "Catching an intermittent drop-out"],
    unexpected: [
      "<strong>A smoothing filter</strong>: AVG steadies a jittery reading, such as noisy mains or a wavering temperature.",
      "<strong>How hot does it get?</strong> MAX on a heatsink, charger or motor over a working session.",
      "<strong>Keeping the meter awake</strong>: recording disables auto power-off for long jobs.",
    ],
    traps: [
      "AVG is not the long-term average: it restarts whenever the reading moves by more than 16 counts.",
      "Short spikes and dips under about 0.3 s can be missed.",
    ],
  },
  {
    id: "rel",
    group: "features",
    panel: "hold",
    name: "Relative (Δ)",
    setup: { dial: "almost any reading", select: "hold HOLD for 1 s; again to cancel" },
    specs: [["Works with", "practically every reading, including MAX/MIN values; it keeps auto-ranging"]],
    how: `<p>The present reading is stored as a reference, and from then on the display shows the reading minus the reference.</p>`,
    expected: ["Removing the leads' resistance before low-ohm readings", "Cancelling lead capacitance before measuring small capacitors", "Temperature differences, such as across a radiator"],
    unexpected: [
      "<strong>Matching parts</strong>: zero on one resistor, capacitor or LED, then read the others as deviations from it.",
      "<strong>Sag under load</strong>: zero on a battery at rest, then switch the load on and read the drop directly.",
      "<strong>Drift</strong>: zero a sensor and watch it wander over time.",
    ],
    traps: ["If you forget Δ is on, every later reading is offset. Look for the Δ symbol."],
  },
  {
    id: "hold",
    group: "features",
    panel: "hold",
    name: "Hold",
    setup: { dial: "any position", select: "press HOLD; again to release" },
    specs: [["Firmware letter", "hold HOLD while switching the meter on"]],
    how: `<p>It simply freezes the display. It's a manual hold: it doesn't capture a reading automatically when the probes make contact.</p>`,
    expected: ["Reading a value measured somewhere you can't see the display"],
    unexpected: ["<strong>Checking the firmware</strong> before relying on AutoV HOLD (see Firmware)"],
    traps: [
      "A held reading on a mains circuit can make you believe something is dead or live when it isn't. Look for the H before you trust the display.",
      "Firmware before revision 9 (g) could show the wrong sign in Hold.",
    ],
  },
  {
    id: "range",
    group: "features",
    panel: "range",
    name: "Manual ranging",
    setup: { dial: "most positions", select: "press RANGE; hold 1 s for auto" },
    specs: [["Not available", "in AutoV, capacitance and Hz (where RANGE sets the trigger level instead)"]],
    how: `<p>Auto-ranging moves up when the reading passes 6000 counts and back down when it gets small. Locking the range stops it hunting near a boundary and saves the moment it takes to range at each new test point.</p>`,
    expected: ["Repeated measurements of similar values", "Keeping the same resolution across a set of readings"],
    unexpected: ["<strong>Working around auto-ranging errors</strong> on AC with a DC offset: start on the highest range (EEVblog manual)"],
    traps: ["In manual range, OL means “too big for this range”, not an open circuit.", "AUTO disappears from the display: remember to go back to auto."],
  },
  {
    id: "backlight",
    group: "features",
    panel: "select",
    name: "Backlight",
    setup: { dial: "any position", select: "hold SELECT for 1 s" },
    specs: [
      ["Colour", "white"],
      ["Auto off", "after 10 minutes"],
      ["Current", "about 23 mA against 2.5 mA without it (HKJ)"],
    ],
    how: `<p>The backlight is a white LED behind the display, powered by a small boost converter. In continuity mode it also flashes as the visual half of BeepLit.</p>`,
    expected: ["Cupboards, lofts and fuse boards"],
    unexpected: ["<strong>A silent continuity tester</strong>: the flashing backlight works where you can't hear the beep"],
    traps: ["It uses about ten times the meter's normal current.", "Up to 5 digits of residue can appear on the 6 V AC, 60 mV AC and 6 A AC ranges with it on."],
  },
  {
    id: "beepjack",
    group: "features",
    panel: "amA",
    name: "Beep-Jack (InEr)",
    setup: { dial: "anything but a current position", select: "automatic" },
    specs: [["Detects", "a plug in the A or mA µA jack while the dial is on another function: beep plus InEr"], ["How", "high-impedance sense resistors (5 MΩ, R30 and R38 in HKJ's teardown) through the jacks' split contacts"]],
    how: `<p>It catches the classic mistake: measuring current, then turning to volts and touching a supply with the red lead still in a current jack. That would put the near-short of the current shunt across the supply.</p>`,
    expected: ["Warning you before you blow a fuse"],
    unexpected: ["<strong>A five-second fuse test</strong>: with the dial on V, plug a lead into each current jack in turn. A beep and InEr mean that fuse is intact; no warning means it has blown (EEVblog manual)"],
    traps: ["InEr with no leads in at all points to a fault: see Troubleshooting."],
  },
  {
    id: "apo",
    group: "features",
    panel: "off",
    name: "Auto power-off",
    setup: { dial: "any position", select: "wake with SELECT, or turn the dial to OFF and back" },
    specs: [
      ["After", "about 32 minutes without activity"],
      ["Counts as activity", "turning the dial or pressing a button; readings above 8.5% of the range; any non-OL Ω, continuity or diode reading; a non-zero Hz reading; a field in EF mode"],
      ["Disabled", "during MAX/MIN recording"],
      ["When off by APO", "still draws about 10 µA"],
    ],
    how: `<p>It's smart: the meter stays on while it's measuring something meaningful, and only times out when idle.</p>`,
    expected: ["Saving the batteries when you forget the meter"],
    unexpected: ["<strong>Unattended monitoring</strong>: a meter left reading a significant value, or recording, stays on"],
    traps: ["There's no documented way to disable it except by recording.", "Turn the dial to OFF: auto power-off still draws a little current."],
  },

  // ---------- living with it ----------
  {
    id: "inside",
    group: "living",
    name: "Inside the meter",
    html: `<p>From HKJ's teardown (three screws hold the case together):</p>
      <ul>
        <li><strong>Measurement chip</strong>: Brymen's own (marked BTC J200), doing the conversion, ranging and true-RMS calculation, with a separate HY2613C display driver.</li>
        <li><strong>Two small EEPROMs</strong> holding the calibration and your last settings. That's why each dial position remembers its last SELECT choice.</li>
        <li><strong>A 10 MΩ main input divider</strong> for the voltage ranges.</li>
        <li><strong>Input protection</strong>: a pair of PTC thermistors with 1 kΩ series resistors, followed by three varistors (MOVs), on a separate input board.</li>
        <li><strong>Current protection</strong>: the HRC fuses, plus five large diodes that protect the µA/mA shunts. The µA shunt is 100 Ω.</li>
        <li><strong>Jack sensing</strong>: 5 MΩ resistors detect plugs in the current jacks, and are rated to stay safe at 1000 V with a blown fuse.</li>
        <li><strong>Backlight</strong>: driven by a small boost converter; the display connects through a zebra strip.</li>
      </ul>
      <p>The EEVblog firmware notes mention a calibration jumper and a debug mode, which later firmware locks out. Leave both alone: they're for factory calibration and testing.</p>`,
  },
  {
    id: "power",
    group: "living",
    name: "Batteries and power",
    html: `<ul>
        <li><strong>Use alkaline AAAs.</strong> EEVblog measured about 240 hours of continuous use from a pair.</li>
        <li><strong>Not fresh lithiums.</strong> Brymen told EEVblog the battery voltage must stay under 3.5 V. The input-warning comparator uses a fixed reference of about 3.6 V, and the main chip is rated to 3.6 V. Two fresh lithium cells at 1.8 V make 3.6 V, and owners report InEr and continuous beeping.</li>
        <li><strong>NiMH rechargeables</strong> (1.2 V each, 2.4 V the pair) sit at or below the 2.5 V battery-symbol threshold. This is inferred from the figures, not tested: expect the symbol early, even though HKJ found readings stay good down to about 1.8 V.</li>
        <li><strong>Low-battery behaviour</strong> (HKJ): the symbol appears at 2.5 V, readings stay correct down to about 1.8 V and then drift upwards (5.000 V read 5.206 V), and the meter shuts off at 1.7 V. The margin is large, but don't ignore the symbol.</li>
        <li><strong>Current</strong>: about 2.5 mA, 23 mA with the backlight on (HKJ), and about 10 µA when auto power-off has switched the meter off.</li>
        <li>Batteries and fuses share one compartment: take the holster off, undo the screw on the back cover, and refit it the same way.</li>
      </ul>`,
  },
  {
    id: "fuses",
    group: "living",
    name: "Fuses",
    table: {
      head: ["Input", "Fuse", "Size", "Suitable parts (EEVblog manual)"],
      rows: [
        ["µA and mA", "400 mA, 1000 V, fast, ceramic HRC; 30 kA breaking capacity in Brymen's current spec, 10 kA in EEVblog's", "6 × 32 mm", "SIBA 7017240.0,4; ASTM HV620; SIBA 7012540.0,4 (rated 750 V AC only)"],
        ["A", "11 A, 1000 V, fast, ceramic HRC, 20 kA", "10 × 38 mm", "Bussmann DMM-B-11A; Littelfuse FLU011; SIBA 5019906.11; ASTM HV110"],
      ],
    },
    after: `<p><strong>Why HRC?</strong> If a supply with a large fault current is shorted through the current input, a high-rupture-capacity fuse quenches the arc in its sand filling. A glass fuse can sustain the arc or shatter. That's the point of the CAT rating, so never substitute cheaper fuses, and beware of fake ceramic fuses sold online.</p>
      <p><strong>Test them</strong> with the Beep-Jack trick (dial on V, plug a lead into each current jack: InEr means the fuse is intact), or measure each fuse's resistance with it removed.</p>`,
  },
  {
    id: "probes",
    group: "living",
    name: "Probes and accessories",
    html: `<ul>
        <li><strong>Test leads</strong>: silicone, marked 1000 V, 10 A and CAT IV (HKJ), about 1 m long and 27 mΩ each, with removable tip caps. Fit the caps in CAT III and IV locations: the standards allow no more than 4 mm of exposed tip there.</li>
        <li><strong>Wear indicators</strong>: Brymen's premium silicone leads, which some dealers supply, have white inner insulation layers. If white shows through anywhere, replace the leads.</li>
        <li><strong>BKP60</strong>: type-K bead thermocouple on a single plug with two banana pins, supplied with the BM235. Fit it the right way round, + to V.</li>
        <li><strong>BKB32</strong> (optional): an adapter from the banana jacks to a standard mini type-K socket, for other thermocouple probes.</li>
        <li><strong>BMH-01</strong> (optional): a magnetic hanger, for hanging the meter on a panel door.</li>
        <li><strong>BMP-25x</strong> (optional): a soft carrying pouch.</li>
        <li><strong>The holster</strong>: a tilt stand, probe holders and a “third hand” position for holding a probe. It's removable and washable, and has to come off to change the batteries.</li>
      </ul>
      <p>Use only leads rated at least as high as the meter. Clip-on accessories have their own ratings, often lower.</p>`,
  },
  {
    id: "firmware",
    group: "living",
    name: "Firmware",
    html: `<p>Hold <kbd>HOLD</kbd> while switching on and the display shows a letter. The EEVblog manual's release notes:</p>`,
    table: {
      head: ["Revision", "Change"],
      rows: [
        ["C", "first EEVblog release"],
        ["d", "fixed HOLD in AutoV dropping the decimal point and turning negative values positive when the voltage was removed. On earlier units, don't use HOLD in AutoV"],
        ["E", "stopped a factory debug mode being entered by holding Hz at power-on"],
        ["F", "negative overloads now show −OL"],
        ["9 (g)", "fixed the negative sign in Hold mode"],
      ],
    },
    after: `<p>Neither manual describes a way for users to update it.</p>`,
  },
  {
    id: "care",
    group: "living",
    name: "Care, storage and calibration",
    html: `<ul>
        <li>Clean the case with a damp cloth and mild detergent. No abrasives or solvents.</li>
        <li>Indoors and dry only: IP40 offers no protection against water.</li>
        <li>Store it between −20 and 60 °C, with the batteries removed if it'll sit unused for more than 60 days.</li>
        <li>Before and after a hazardous-voltage job, check it on a known source, such as a known live socket.</li>
        <li>Brymen's manual doesn't give a calibration interval. If accuracy matters, compare the meter against a known voltage reference or a calibrated meter from time to time.</li>
      </ul>`,
  },
  {
    id: "trouble",
    group: "living",
    name: "Troubleshooting",
    table: {
      head: ["Symptom", "Likely cause", "What to do"],
      rows: [
        ["InEr and beeping with no leads in", "contaminated jacks (the sensing is high-impedance), flux residue, splayed battery springs, or batteries over 3.5 V", "clean the jacks with isopropyl alcohol, check the springs, fit fresh alkalines"],
        ["Current reads zero", "blown fuse", "Beep-Jack test, then replace with the same HRC type"],
        ["Readings drift upwards", "batteries nearly flat (below about 1.8 V)", "replace the batteries"],
        ["Wrong kind of reading", "SELECT memory: the position came back in another function", "check ~, ⎓, mV or °C on the display"],
        ["Readings offset", "relative (Δ) left on", "hold HOLD for a second to cancel"],
        ["OL on a value that should fit", "a manual range is locked", "hold RANGE for auto"],
        ["Temperature wrong", "the meter hasn't settled after moving, or the probe is reversed", "wait up to an hour; + to V"],
        ["Tens of volts on a dead wire", "ghost voltage on the 10 MΩ input", "check in AutoV"],
        ["Frequency shows 0", "the signal doesn't cross zero, or the trigger level is too high", "a more sensitive range, or measure an AC-coupled signal"],
        ["Meter switched itself off", "auto power-off after about 32 minutes idle", "SELECT to wake; REC keeps it on"],
      ],
    },
  },
  {
    id: "limits",
    group: "living",
    name: "What it can't do",
    html: `<ul>
        <li><strong>Duty cycle, or high-frequency AC.</strong> True RMS is specified to 440 Hz.</li>
        <li><strong>Insulation resistance.</strong> That needs a 250–1000 V insulation tester; this meter tests at 1.6 V.</li>
        <li><strong>Current without breaking the circuit.</strong> It's not a clamp meter, although a clamp adapter on mV gets close.</li>
        <li><strong>Fast peaks or inrush.</strong> MAX/MIN needs about 0.3 s.</li>
        <li><strong>ESR, inductance, or four-wire low ohms.</strong></li>
        <li><strong>Logging to a computer.</strong> Brymen's manual describes no PC interface.</li>
        <li><strong>Phase rotation.</strong> It's mentioned in the shared manual's auto power-off list but belongs to other models.</li>
        <li><strong>Proving dead with EF alone.</strong> Detection is never proof.</li>
      </ul>`,
  },
];

export const SOURCES = [
  ["Brymen: user's manual, BM231 / BM233 / BM235 (2023)", "http://www.brymen.com/images/ProductsList/BM230_List/BM230-print1-woCATII.pdf"],
  ["EEVblog: BM235 user's manual, revision 17 August 2020", "https://www.welectron.com/mediafiles/manuals/eevblog/EEVBlog-BM235-Manual.pdf"],
  ["Brymen: BM235 product sheet", "http://brymen.com/images/ProductsList/BM230_List/BM235/BM235_A4.pdf"],
  ["HKJ (lygte-info.dk): DMM Brymen BM235 review and teardown", "https://lygte-info.dk/review/DMMBrymen%20BM235%20UK.html"],
  ["EEVblog forum: “The BM235 does not accept lithium batteries” (Brymen's explanation)", "https://www.eevblog.com/forum/testgear/the-bm235-does-not-accept-lithium-batteries/msg1031797/"],
  ["EEVblog forum: “Brymen BM235 InEr issue”", "https://www.eevblog.com/forum/testgear/brymen-bm235-iner-issue/msg5586665/"],
];
