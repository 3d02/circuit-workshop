// The Brymen BM235: dial positions, buttons, specifications and calculators.
//
// Figures come from Brymen's user's manual for the BM231/BM233/BM235 (2023,
// P/N 7M1C-1501-C000) and the EEVblog edition of the manual (revision of
// 17 August 2020, with Dave Jones's notes). A few measured values come from
// HKJ's review on lygte-info.dk and are marked as such in the text.
// DOM-free, so the calculators can be tested.

export const SOURCES = [
  {
    title: "Brymen: user's manual, BM231 / BM233 / BM235",
    note: "The official manual for current production (2023, P/N 7M1C-1501-C000). Top range 600 V; CAT III 600 V and CAT IV 300 V.",
    href: "http://www.brymen.com/images/ProductsList/BM230_List/BM230-print1-woCATII.pdf",
  },
  {
    title: "EEVblog: BM235 user's manual, revision 17 August 2020",
    note: "The same manual for the earlier 1000 V version (CAT II 1000 V as well), with Dave Jones's notes on fuses, burden voltage, LoZ and firmware.",
    href: "https://www.welectron.com/mediafiles/manuals/eevblog/EEVBlog-BM235-Manual.pdf",
  },
  {
    title: "Brymen: BM230 series product page",
    note: "Downloads, catalogue and the BM235 product sheet.",
    href: "http://www.brymen.com/PD02BM230_235.html",
  },
  {
    title: "EEVblog: BM235 product page",
    note: "Where EEVblog posts the latest version of its manual.",
    href: "https://www.eevblog.com/product/bm235/",
  },
  {
    title: "HKJ (lygte-info.dk): DMM Brymen BM235 review",
    note: "Independent measurements: test voltages and currents, continuity threshold, capacitance speed, LoZ impedance, behaviour on a low battery.",
    href: "https://lygte-info.dk/review/DMMBrymen%20BM235%20UK.html",
  },
];

// The jacks, left to right as they sit on the meter.
export const JACKS = {
  A: "A jack (10 A)",
  mA: "mA µA jack",
  COM: "COM",
  V: "V Ω jack",
};

// Dial positions, clockwise from the left. `angle` is degrees from 12 o'clock.
export const POSITIONS = [
  {
    id: "autov",
    dial: ["Auto V", "LoZ"],
    angle: -105,
    name: "AutoV (LoZ)",
    what: "Mains and wiring checks. Chooses AC or DC by itself and puts enough load on the circuit to make ghost voltages disappear.",
    select: [],
    selectNote: "SELECT does nothing here. Only HOLD, EF and the backlight work in AutoV.",
    leads: { red: ["V"], black: "COM" },
    lcd: { value: "230.4", unit: "V", flags: ["LoZ", "AC"] },
    specs: [
      ["Range", "600.0 V, AC or DC, picked automatically (1000 V on older units)"],
      ["Shows a reading above", "about 1 V. “- - - -” means ready and nothing there"],
      ["Accuracy", "±(2.0% + 3 digits), 45–440 Hz"],
      ["Input impedance", "about 2.1 kΩ at first, rising within a fraction of a second on a real high voltage (12 kΩ at 100 V, 100 kΩ at 300 V, 240 kΩ at 600 V). Below about 6 V AC or 8 V DC it stays high, over 8 MΩ"],
      ["Discharging capacitors", "drains a charged capacitor down to about 8 V while showing its voltage. On high voltages the meter limits itself to roughly a watt, so big capacitors take a while"],
    ],
    how: `<p>The ordinary voltage input is 10 MΩ, so it needs almost no current to show a voltage. That's usually what you want, but it also means that a disconnected wire lying next to a live one in the same cable can show a large <strong>ghost voltage</strong>, picked up through the capacitance between them.</p>
      <p>In AutoV the meter puts about 2.1 kΩ across its input. A ghost can't supply that much current and collapses to a few volts, while a real supply hardly notices. On a genuine high voltage the meter raises its impedance within a fraction of a second so it doesn't overheat.</p>
      <p>It shows AC or DC, whichever is larger at its peak, so you don't have to know in advance.</p>
      <p>The same low impedance makes AutoV a <strong>capacitor discharger</strong>, as Dave Jones points out in the EEVblog manual. Across a charged capacitor it drains the charge and shows the voltage falling, so you can see when it's safe. It works down to about 8 V DC; below that the input goes back to 10 MΩ and the last few volts drain very slowly.</p>`,
    use: [
      "Checking a socket, a light switch or a fused spur",
      "Telling a live wire from a disconnected one",
      "Proving a circuit dead before working on it (prove–test–prove, below)",
      "Discharging a capacitor while watching its voltage fall, down to about 8 V (see “Discharge a capacitor with AutoV” under Around the house)",
    ],
    watch: [
      "The low impedance is a real load: at first up to about 155 mA on 230 V mains, and up to 0.4 A at 600 V AC. Never use AutoV on electronics, sensor wiring or anything delicate. Use the V position instead.",
      "Measuring live to earth sends that current down the earth wire, which can trip an RCD. If it does, measure live to earth on the V position.",
      "No Hz, no manual ranging, no MAX/MIN and no relative mode in this position.",
      "Only discharge capacitors within the meter's rating (600 V; 1000 V on older units). Never use it on a microwave oven's capacitor, which runs at about 2 kV.",
    ],
  },
  {
    id: "off",
    dial: ["OFF"],
    angle: -77,
    name: "Off, batteries and fuses",
    what: "Off. The meter also switches itself off after about 32 minutes without activity.",
    select: [],
    leads: null,
    lcd: { value: "", unit: "", flags: [] },
    specs: [
      ["Batteries", "2 × AAA alkaline; about 240 hours of continuous use (measured by EEVblog). The battery symbol appears below about 2.5 V"],
      ["Auto power-off", "after about 32 minutes with no button press and no significant reading. It stays on while readings are changing, and never switches off while MAX/MIN is recording. Wake it with SELECT"],
      ["Backlight", "switches itself off after 10 minutes. It uses about ten times the meter's normal current (HKJ measured 23 mA against 2.5 mA)"],
      ["Fuse, mA µA jack", "400 mA, 1000 V, ceramic HRC, 6 × 32 mm (input rated to 600 mA)"],
      ["Fuse, A jack", "11 A, 1000 V, ceramic HRC, 10 × 38 mm"],
    ],
    how: `<p>Batteries and both fuses sit under one cover on the back: take the holster off first, then undo the single screw. Hold <kbd>HOLD</kbd> while switching on and the display shows a letter for the firmware revision.</p>
      <p>If the meter won't be used for more than 60 days, take the batteries out.</p>`,
    useTitle: "Replacement fuses",
    use: [
      "Suitable replacement fuses named in the EEVblog manual: SIBA 7017240.0,4 or ASTM HV620 for 400 mA; Bussmann DMM-B-11A, Littelfuse FLU011 or SIBA 5019906.11 for 11 A",
    ],
    watch: [
      "Replace the batteries as soon as the battery symbol appears. HKJ found that readings drift as the batteries run down, before the meter switches itself off.",
      "Use alkaline AAAs. Lithium AAAs start at a higher voltage, and the EEVblog manual says they may need running down a little before use.",
      "Never fit glass fuses or lower-rated ones. The ceramic HRC fuses are what make a mistake on a high-energy circuit survivable. Beware of fake ceramic fuses sold online.",
    ],
  },
  {
    id: "v",
    dial: ["V", "~ ⎓ VFD"],
    angle: -49,
    name: "Volts: AC, DC and VFD",
    what: "General-purpose voltage: batteries, power supplies, chargers, sockets, transformers.",
    select: ["AC V", "DC V", "VFD AC V (filtered)"],
    selectNote: "Press SELECT to step through them. The display shows ~ for AC, ⎓ for DC and VFD for the filtered mode.",
    leads: { red: ["V"], black: "COM" },
    lcd: { value: "12.63", unit: "V", flags: ["AUTO", "DC"] },
    specs: [
      ["Ranges", "6.000 V, 60.00 V, 600.0 V (older units add 1000 V); auto-ranging"],
      ["DC accuracy", "±(0.3% + 2 d) on 6 V, ±(0.4% + 2 d) on 60 V, ±(0.2% + 2 d) on 600 V"],
      ["AC accuracy", "±(0.7% + 3 d) at 50–60 Hz; ±(2.0% + 3 d) from 45 to 440 Hz"],
      ["VFD", "600 V range, low-pass filtered: ±(1.0% + 3 d) for a 10–100 Hz fundamental"],
      ["Input impedance", "10 MΩ in parallel with 54 pF"],
    ],
    how: `<p>The input is a 10 MΩ chain of resistors that divides the voltage down to what the converter can handle, so the meter draws only 1 µA for every 10 V. Auto-ranging picks the tap that gives the most digits.</p>
      <p>AC is <strong>true RMS</strong>: the meter works out the heating value of the waveform rather than scaling an average. Distorted waveforms from dimmers, chargers and inverters therefore read correctly, as long as they're within its bandwidth of a few hundred hertz.</p>
      <p><strong>VFD</strong> mode adds a digital low-pass filter. Motor speed controllers and some inverters switch their output at kilohertz rates, and the filter strips that out to show the voltage of the 10–100 Hz fundamental. It also steadies readings in electrically noisy places.</p>`,
    use: [
      "Batteries, chargers and plug-in power supplies",
      "Sockets and low-voltage transformers such as doorbells and garden lights",
      "Frequency: press Hz while measuring",
    ],
    watch: [
      "Check for ~ or ⎓ before trusting a reading. The meter comes back in whatever you selected last time, even after being switched off.",
      "10 MΩ is so light a load that disconnected wires near live ones can show tens of volts. If a reading on house wiring looks odd, check it in AutoV.",
      "AC with a large DC offset can fool auto-ranging into reading low. Choose the range by hand, starting from the highest (EEVblog manual).",
    ],
  },
  {
    id: "ohm",
    dial: ["Ω", "•)))"],
    angle: -21,
    name: "Resistance and continuity",
    what: "Resistance, and a continuity test that beeps and flashes the backlight.",
    select: ["Resistance Ω", "Continuity •)))"],
    leads: { red: ["V"], black: "COM" },
    lcd: { value: "24.1", unit: "Ω", flags: ["AUTO"] },
    specs: [
      ["Ranges", "600.0 Ω, 6.000 kΩ, 60.00 kΩ, 600.0 kΩ, 6.000 MΩ, 60.00 MΩ"],
      ["Accuracy", "±(0.3% + 3 d) up to 6 kΩ; ±(0.5% + 3 d) to 600 kΩ; ±(0.9% + 2 d) on the MΩ ranges; ±(5% + 20 d) above 30 MΩ"],
      ["Test voltage", "about 1.6 V with the probes apart (HKJ measured 1.8 V and 0.16 mA into a short)"],
      ["Continuity", "beeps and flashes the backlight below a threshold somewhere between 30 and 480 Ω (HKJ's sample: 161 Ω); reacts within 15 ms"],
    ],
    how: `<p>The meter pushes a small, known current from its own batteries through the part and measures the voltage that appears: R = V ÷ I, as in {{ch:resistance}}. On the top ranges the current is tiny (0.2 µA on 6 MΩ, 0.02 µA on 60 MΩ), so high values take a moment to settle and your fingers touching both probes will change them.</p>
      <p>Continuity uses the same circuit but answers yes or no, and does it fast enough (under 15 ms) to catch a wire that only breaks when it's moved.</p>`,
    use: [
      "Fuses, filament bulbs and heating elements",
      "Cables, extension leads and switches",
      "Temperature sensors (NTC thermistors), checked against a thermometer",
    ],
    watch: [
      "Only on something switched off and unplugged. Outside voltage gives wrong readings and can damage the meter.",
      "In a circuit, other parts connected in parallel make readings low. Lift one leg if in doubt.",
      "For low values, touch the probes together and hold HOLD for a second (Δ) to subtract the leads' own resistance, about 0.05 Ω plus contact.",
      "A beep means “below the threshold”, not “zero ohms”. Read the display when the value matters.",
      "1.6 V is enough to switch on a silicon junction, so diodes and transistors in a circuit can affect readings.",
    ],
  },
  {
    id: "mv",
    dial: ["mV", "°C °F"],
    angle: 7,
    name: "Millivolts and temperature",
    what: "Small voltages, and temperature with the supplied type-K probe.",
    select: ["DC mV", "AC mV", "°C", "°F"],
    leads: { red: ["V"], black: "COM" },
    leadsNote: "For temperature, the BKP60 probe's plug goes into V (+) and COM (−), the right way round.",
    lcd: { value: "4.0", unit: "°C", flags: [] },
    specs: [
      ["Ranges", "60.00 mV and 600.0 mV; 0.01 mV resolution on the lower one"],
      ["Accuracy", "DC ±(0.3% + 2 d); AC ±(1.0% + 3 d) at 10–500 Hz"],
      ["Input", "10 MΩ, protected to 600 V. For AC, keep the signal's peaks (including any DC) under 130 mV on 60 mV and 1.3 V on 600 mV"],
      ["Temperature", "−40 to 400 °C (−40 to 752 °F), ±(1% + 1 °C) plus the probe's own tolerance. The bead probe is sold as good to about 250 °C"],
    ],
    how: `<p>The mV ranges skip the divider, so the converter sees the input almost directly, with 10 µV resolution.</p>
      <p>A type-K thermocouple is two different alloys welded together at the tip. A temperature difference between the tip and the far end, where it plugs into the meter, produces about 41 µV per °C. The meter measures that tiny voltage, adds the temperature of its own sockets (the <strong>cold junction</strong>, sensed inside the case), and shows the temperature at the tip.</p>`,
    use: [
      "Fridges, freezers, radiators, hot water, 3D-printer beds",
      "Voltage drop across a car fuse or a connection, to find hidden current or a bad contact",
      "Solar cells, sensors and shunt resistors",
    ],
    watch: [
      "The meter itself must be at room temperature. After a change of more than 5 °C, for example from a cold car to a warm house, allow up to an hour or the cold-junction correction is off.",
      "Plug the probe in the right way round: + to V, − to COM.",
      "Keep the bead probe away from live parts and within its own rating.",
    ],
  },
  {
    id: "capdiode",
    dial: ["⊣⊢", "▶|"],
    angle: 35,
    name: "Capacitance and diode test",
    what: "Capacitors, and the diode test, which also checks LEDs.",
    select: ["Capacitance", "Diode ▶|"],
    leads: { red: ["V"], black: "COM" },
    leadsNote: "Red goes to the + of an electrolytic, and to the anode of a diode or LED.",
    lcd: { value: "4.12", unit: "µF", flags: [] },
    specs: [
      ["Capacitance", "20.00 nF to 10.00 mF, auto-ranging only. ±(1.5% + 8 d) on the nF ranges, ±(1.5% + 2 d) up to 2000 µF, ±(4.5% + 10 d) on 10 mF"],
      ["Speed", "small values in about a second; HKJ timed 1000 µF at about 7 s"],
      ["Diode test", "3.000 V range, about 0.3 mA, under 3.2 V with the probes apart"],
    ],
    how: `<p>For capacitance the meter charges and discharges the part with a known current and times how long the voltage takes to change: C = I × t ÷ V. Bigger capacitors take longer, which is why a 1000 µF reading takes several seconds.</p>
      <p>The diode test pushes about 0.3 mA through the part and shows the voltage across it, the forward voltage from {{ch:leds}}. A good silicon diode reads 0.4–0.9 V one way and OL the other.</p>`,
    use: [
      "Motor run capacitors in fans, pumps and washing machines",
      "Electrolytic capacitors that may have dried out",
      "Bridge rectifiers, diodes and LED polarity: red on the anode makes most LEDs glow faintly",
    ],
    watch: [
      "Discharge capacitors first and measure them out of the circuit. A charged one gives nonsense and can damage the meter. AutoV discharges them while showing the voltage; finish the last few volts with a resistor.",
      "For small capacitors, cancel the leads' own capacitance first: probes apart, hold HOLD for a second (Δ).",
      "Diode readings: 0 V both ways means shorted; OL both ways means open.",
      "Blue and white LEDs need about 2.7–3.2 V, right at the limit of the test. They may read OL and barely glow.",
    ],
  },
  {
    id: "amA",
    dial: ["A mA", "~ ⎓"],
    angle: 63,
    name: "Current: milliamps and amps",
    what: "Current from milliamps up to 10 A. The jack the red lead is in decides which ranges you get.",
    select: ["DC", "AC"],
    leads: { red: ["mA", "A"], black: "COM" },
    leadsNote: "Red in the mA µA jack gives the 60 mA and 600 mA ranges; red in the A jack gives 6 A and 10 A. If you don't know how big the current is, start with the A jack.",
    lcd: { value: "0.038", unit: "A", flags: ["AUTO", "DC"] },
    specs: [
      ["mA µA jack", "60.00 mA and 600.0 mA. Burden 1.9 mV per mA (a 1.9 Ω shunt). Fused 400 mA / 1000 V"],
      ["A jack", "6.000 A and 10.00 A. Burden 40 mV per A (40 mΩ). Fused 11 A / 1000 V. 10 A continuously; up to 20 A for 30 s at most, then 5 minutes to cool"],
      ["Accuracy", "DC ±(0.7% + 3 d); AC ±(1.0% + 3 d) at 50–400 Hz"],
    ],
    how: `<p>Inside, the current flows through a small, precise resistor called a <strong>shunt</strong>, and the meter measures the voltage across it. That's why the meter has to be in series, part of the loop, as in {{ch:multimeter}}. It's also why the meter is nearly a short circuit in this mode: across a supply it would pass a huge current, and that's what the fuses are for.</p>
      <p>The shunt's voltage drop, the <strong>burden voltage</strong>, is taken away from your circuit. On the 600 mA range a 500 mA load loses almost a volt. The calculator under “How it works” shows the effect.</p>`,
    use: [
      "Current drawn by LED strips, gadgets and chargers, on the low-voltage side",
      "Parasitic drain in a car, up to 10 A",
      "How much a battery charger is really putting in",
    ],
    watch: [
      "Never across a battery, socket or power supply. Break the circuit and put the meter in the gap.",
      "Move the red lead back to V when you're done. If you forget and turn to another function, the meter beeps and shows InEr.",
      "For mains appliances, a clamp meter or a plug-in energy meter is safer and easier than breaking the circuit.",
      "On low-voltage circuits, mind the burden voltage. If a circuit misbehaves with the meter in, try the A jack.",
    ],
  },
  {
    id: "ua",
    dial: ["µA", "~ ⎓"],
    angle: 91,
    name: "Microamps",
    what: "Tiny currents, down to 0.1 µA: standby and sleep currents, leakage.",
    select: ["DC", "AC"],
    leads: { red: ["mA"], black: "COM" },
    lcd: { value: "5.8", unit: "µA", flags: ["AUTO", "DC"] },
    specs: [
      ["Ranges", "600.0 µA and 6000 µA; 0.1 µA resolution"],
      ["Accuracy", "DC ±(1.0% + 3 d); AC ±(1.5% + 3 d) at 50–400 Hz"],
      ["Burden", "0.1 mV per µA (a 100 Ω shunt): 60 mV at 600 µA, 0.6 V at 6 mA"],
    ],
    how: `<p>This works like the mA ranges, but with a bigger 100 Ω shunt, so a tiny current still makes a measurable voltage. The trade-off is a bigger drop: at the top of the 6000 µA range it takes 0.6 V from your circuit.</p>
      <p>Brymen's manual mentions boiler flame sensors, which signal with a few microamps. That's a job for a gas engineer, but it explains why the 0.1 µA resolution is there.</p>`,
    use: [
      "Standby current of battery gadgets such as remotes, smoke alarms and wireless sensors, and from it their battery life",
      "Leakage through a capacitor, or through a device that's supposedly off",
    ],
    watch: [
      "A sleeping gadget may draw milliamps when it wakes, and the 100 Ω shunt can then drop enough voltage to make it reset. If that happens, move up to the mA range.",
      "Same rule as all the current ranges: in series, never across a supply.",
    ],
  },
];

// The push-buttons. Each one selects an explanation; none moves the dial.
export const FEATURES = [
  {
    id: "select",
    key: "SELECT",
    name: "SELECT and the backlight",
    what: "Steps through the functions printed around each dial position. Hold it for a second to switch the backlight on or off.",
    specs: [
      ["Memory", "each dial position remembers its last choice, even after the meter is switched off"],
      ["Backlight", "switches itself off after 10 minutes"],
    ],
    watch: ["Because of the memory, always check the display symbols (~, ⎓, Ω, •))), mV, °C) before you trust a reading."],
  },
  {
    id: "range",
    key: "RANGE",
    name: "RANGE",
    what: "Auto-ranging is the default, shown by AUTO on the display. Press RANGE to lock the current range, press again to step to the next one, and hold it for a second to go back to auto.",
    specs: [
      ["Not available", "in AutoV, capacitance and Hz"],
      ["In Hz mode", "chooses the trigger level"],
      ["In EF mode", "switches between high (EF-H) and low (EF-L) sensitivity, which is why it's labelled Level"],
    ],
    how: `<p>Locking the range stops the meter hunting when a value sits near a range boundary, and saves the moment it takes to range each time you probe a series of similar points.</p>`,
    lcd: { value: "12.63", unit: "V", flags: ["DC"] },
  },
  {
    id: "rec",
    key: "REC",
    name: "REC: MAX, MIN and AVG",
    what: "Records the highest, lowest and average readings. Press once to start; the meter beeps at each new maximum or minimum. Press again to step through MAX, MIN and AVG, and hold for a second to stop.",
    specs: [
      ["Ranging", "stays automatic while recording"],
      ["Auto power-off", "disabled while recording, so you can leave it running overnight"],
      ["AVG", "a rolling average of the last 16 readings, which starts again when the input jumps by more than 16 counts (EEVblog manual)"],
    ],
    watch: ["The meter takes about 5 readings a second, so a very short spike or dip can slip between them. HKJ found a change has to last roughly 0.3 s to be caught."],
    lcd: { value: "9.82", unit: "V", flags: ["MIN", "DC"] },
  },
  {
    id: "hold",
    key: "HOLD",
    name: "HOLD and relative (Δ)",
    what: "Press HOLD to freeze the display and again to release it. Hold it for a second for relative mode (Δ): the present reading becomes zero, and later readings show the difference from it.",
    specs: [
      ["Relative works with", "almost every reading, including MAX/MIN values"],
      ["Firmware", "hold HOLD while switching on and the display shows the revision letter"],
    ],
    how: `<p>Relative mode removes the test leads' own resistance before a low-ohm measurement, cancels lead capacitance before measuring a small capacitor, and shows a difference directly, such as the temperature drop across a radiator.</p>`,
    lcd: { value: "0.00", unit: "Ω", flags: ["Δ"] },
  },
  {
    id: "hz",
    key: "Hz",
    name: "Hz: frequency",
    what: "Measures frequency in the V, mV and current positions. Measure the voltage first, then press Hz, so the trigger level suits the signal.",
    specs: [
      ["Range", "10 Hz–50 kHz on the mV, 6 V and 60 V ranges; 10 Hz–1 kHz on 600 V; 10 Hz–5 kHz on µA and mA; 50 Hz–1 kHz on A"],
      ["Accuracy", "±(0.03% + 2 d)"],
      ["Trigger level", "follows the range. If the reading jumps about, press RANGE for a less sensitive level; if it shows zero, a more sensitive one"],
    ],
    lcd: { value: "50.00", unit: "Hz", flags: ["AC"] },
  },
  {
    id: "ef",
    key: "EF",
    name: "EF: non-contact voltage detection",
    what: "Press EF and the display shows EF-H, high sensitivity; RANGE switches to EF-L. Bring the top-left end of the meter, where the antenna is, near a cable: bars and a beep that rises in pitch show the field strength.",
    specs: [
      ["EF-H, 1 to 5 bars", "about 10, 20, 40, 80 and 160 V or more"],
      ["EF-L, 1 to 5 bars", "about 40, 80, 160, 300 and 500 V or more"],
      ["Probe contact", "for a more precise answer, plug one lead into COM (the most sensitive) or V and touch a single conductor"],
    ],
    how: `<p>It senses the 50/60 Hz electric field around a conductor that has a voltage on it, through the small capacitance between the wire, the meter and you. It responds to voltage, not current, so a lamp flex shows a field even when the lamp is switched off.</p>`,
    watch: [
      "Silence never proves a wire is dead. DC, screened or armoured cable, wires in metal conduit or deep in a wall, and a meter held in an insulated hand can all show nothing.",
      "Use it to find live parts, then confirm with a contact measurement.",
    ],
    lcd: { value: "EF-H", unit: "", flags: [], bars: 4 },
  },
];

export const ITEMS = [...POSITIONS, ...FEATURES];

// The habits that matter most, in order.
export const MUST = [
  ["Read the display before you trust a reading", "Every dial position remembers its last SELECT choice, even after power-off. V can come up in DC when you expected AC, and mV can come up in °C. Check for ~, ⎓, Ω or •))) every time."],
  ["Red lead in V, except while measuring current", "Only move it to mA µA or A for a current measurement, and move it straight back. If a lead is in a current jack while the dial is elsewhere, the meter beeps and shows InEr: listen to it."],
  ["Current mode is a short circuit", "In µA, mA and A the meter is a low-value resistor. Across a battery or socket it blows a fuse at best. Current is measured in series: break the circuit and let the meter close the gap."],
  ["Power off for Ω, continuity, diode and capacitance", "These modes use the meter's own test current. Unplug the device and discharge capacitors first: AutoV does that while showing the voltage, down to about 8 V. Outside voltage gives wrong answers and can damage the meter."],
  ["Silence from a detector doesn't mean dead", "EF and AutoV can show you that a voltage is there. Only a contact test with a meter you've just proved on a known live source shows that it isn't: prove, test, prove."],
  ["AutoV for wiring, V for electronics", "AutoV puts about 2 kΩ across whatever it touches. That's right for mains wiring and wrong for electronics or sensor lines, and measuring live to earth with it can trip an RCD."],
  ["Know your ratings and use the tip caps", "The label beside COM says what the meter is rated for: CAT IV 300 V and CAT III 600 V (older units add CAT II 1000 V). At a fuse board or a socket, fit the tip caps and keep your fingers behind the guards."],
  ["Check the fuses in five seconds; keep fresh batteries", "With the dial on V, plug a lead into the A jack and then the mA µA jack. A beep and InEr mean that fuse is intact; no warning means it has blown (EEVblog manual). Replace only with ceramic HRC fuses of the same rating, and change the batteries as soon as the battery symbol appears."],
];

// Jobs around the house. `modes` are POSITIONS or FEATURES ids.
export const USES = [
  {
    group: "Batteries and the car",
    items: [
      {
        title: "Sort a drawer of batteries",
        modes: ["v"],
        html: `<p>DC volts, red on +. Roughly, with nothing connected:</p>
          <ul><li>Alkaline AA/AAA: 1.55–1.65 V new. Below about 1.3 V, keep it for clocks and remotes.</li>
          <li>NiMH rechargeable: 1.3–1.4 V straight off the charger, about 1.2 V for most of its life. That's normal.</li>
          <li>CR2032 coin cell: about 3.2 V new. It stays near 3 V for most of its life and then falls quickly; under 2.8 V it's nearly done.</li>
          <li>9 V alkaline: 9.3–9.6 V new.</li></ul>
          <p class="small-note">With nothing connected, a tired battery looks healthier than it is. Measure it in the device, while the device is running, for a truer answer.</p>`,
      },
      {
        title: "Car battery and charging",
        modes: ["v", "rec"],
        html: `<p>Engine off for a few hours: 12.6–12.7 V is fully charged, about 12.4 V three-quarters, 12.2 V half, 12.0 V or less flat. Engine running: 13.8–14.7 V means the alternator is charging (some modern cars vary this more widely).</p>
          <p>For a cranking test, press <kbd>REC</kbd>, have someone start the engine, then step to MIN. A healthy battery stays above about 10 V while cranking.</p>
          <p class="small-note">At 5 readings a second, MIN is a good guide rather than the exact bottom of the dip.</p>`,
      },
      {
        title: "Find what drains the car battery overnight",
        modes: ["amA"],
        html: `<ol><li>Everything off, key out, doors shut or their latches closed with a screwdriver.</li>
          <li>Disconnect the negative battery terminal. Clip the meter between the negative post and the cable: red lead in the <strong>A</strong> jack, dial on A mA, DC.</li>
          <li>Wait for the car's control units to go to sleep (often 10–40 minutes), then read. Many cars settle at 20–50 mA. Hundreds of milliamps means something is staying awake: pull fuses one at a time until it drops.</li></ol>
          <p class="small-note">The 6 A range resolves 1 mA, which is plenty here. Don't swap to the mA jack mid-test: breaking the circuit wakes everything up again. Never start the car or switch on the lights with the meter connected, because the current would blow the 11 A fuse. Some cars lose radio codes or settings when the battery is disconnected.</p>`,
      },
      {
        title: "…or find it without disconnecting anything",
        modes: ["mv"],
        html: `<p>Each fuse is a tiny resistor of a few milliohms, so current through it makes a small voltage. With the car asleep, choose DC mV and touch the probes to the two test points on top of each blade fuse in turn.</p>
          <p>A fuse showing even 0.1 mV has current flowing through it, and you've found the circuit without breaking anything. Charts published online convert millivolts into milliamps for each fuse size and rating.</p>`,
      },
    ],
  },
  {
    group: "Mains checks, carefully",
    intro: `Mains electricity can kill. The BM235 is built for these checks, with CAT III 600 V and CAT IV 300 V ratings, ceramic HRC fuses and 6 kV surge protection, but the meter is only part of the safety. Fit the tip caps, keep your fingers behind the guards, check the leads for damage first, and never work on anything you can't see clearly. In many countries only a qualified electrician may work on fixed wiring: check your local rules, and if in doubt, call one.`,
    items: [
      {
        title: "Check a socket",
        modes: ["autov", "hz"],
        html: `<p>In AutoV, one probe in each hole:</p>
          <ul><li>Live to neutral: about 230 V. Anything from 207 to 253 V is within the European limits.</li>
          <li>Live to earth: about the same.</li>
          <li>Neutral to earth: close to 0 V. A few volts is normal when other things on the circuit are running.</li></ul>
          <p>For frequency, switch to V (AC) and press <kbd>Hz</kbd>: 50.0 Hz in Europe, 60 Hz in the Americas.</p>
          <p class="small-note">On Schuko-type sockets live can be on either side; that's normal. If measuring live to earth in AutoV trips the RCD, use the V position for that pair.</p>`,
      },
      {
        title: "Prove it's dead before you touch it",
        modes: ["autov", "ef"],
        html: `<ol><li><strong>Prove</strong> the meter works: measure a known live socket in AutoV.</li>
          <li>Switch off at the fuse board, and make sure nobody can switch it back on.</li>
          <li><strong>Test</strong> at the point of work: every pair (live–neutral, live–earth, neutral–earth). The display should stay at “- - - -”.</li>
          <li><strong>Prove</strong> the meter again on the known live socket, to show it didn't fail during the test.</li></ol>
          <p class="small-note">EF is a handy first check, but silence from it is never proof. AutoV's low impedance stops a ghost voltage from fooling you into thinking a dead wire is live.</p>`,
      },
      {
        title: "Which side does the lamp switch break?",
        modes: ["ef"],
        html: `<p>With reversible plugs such as Schuko, a lamp's cord switch can end up breaking the neutral instead of the live: the bulb goes out, but its holder stays live.</p>
          <p>Switch the lamp off, press <kbd>EF</kbd> (press RANGE for EF-L if EF-H fires everywhere), and hold the top-left end of the meter near the bulb holder. Then turn the plug round and try again. The way round that shows less field at the holder is the one where the switch breaks the live. Leave it like that, and unplug the lamp before changing a bulb anyway.</p>`,
      },
      {
        title: "Trace a live flex, or a break in one",
        modes: ["ef"],
        html: `<p>With a flex plugged in and switched on at the socket, slide the top-left end of the meter along it with EF on. The signal follows the live conductor and falls away where that conductor is broken.</p>
          <p class="small-note">This works on flexes, extension leads and old-style mains fairy lights. It can't see through metal conduit or screened or armoured cable, and it isn't a reliable way to find cables buried in a wall.</p>`,
      },
    ],
  },
  {
    group: "Appliances and repairs",
    note: "Unplug first, every time. Resistance, continuity, diode and capacitance only work on dead circuits.",
    items: [
      {
        title: "Fuses and bulbs",
        modes: ["ohm"],
        html: `<p>Take the fuse out and test it on its own: a good one beeps and reads close to 0 Ω. This works for plug-top fuses, 5 × 20 mm glass fuses, car blade fuses, and the thermal fuses inside kettles and hairdryers.</p>
          <p>A filament bulb reads much lower cold than hot (roughly a tenth). OL means the filament is broken.</p>`,
      },
      {
        title: "Heating elements",
        modes: ["ohm"],
        calc: "element",
        html: `<p>Disconnect the element's wires and measure across its terminals. Expect R = V² ÷ P. OL means it has burned through.</p>
          <p>Then measure from each terminal to the metal sheath or case: it should read OL. Any reading there means a leaking element. Note that the meter's 1.6 V test can't prove the insulation is good; that takes a 500 V insulation tester.</p>`,
      },
      {
        title: "Cables, extension leads and switches",
        modes: ["ohm"],
        html: `<p>Unplugged, each conductor should beep end to end, and every pair of conductors should read OL. To tell the wires apart in a long run, twist two together at the far end and look for the beep.</p>
          <p>The continuity test reacts in under 15 ms, so wiggle the cable while you listen: a break that comes and goes shows up as a stutter. A switch should beep when on and read OL when off.</p>`,
      },
      {
        title: "Discharge a capacitor with AutoV",
        modes: ["autov", "capdiode"],
        calc: "discharge",
        html: `<p>Capacitors in power supplies, motors and flash units can hold a charge long after unplugging. AutoV drains it for you (Dave Jones's tip in the EEVblog manual). Turn to AutoV, hold the probes firmly on the two terminals (clip-on probes make it easier) and watch the reading fall. Polarity doesn't matter; the reading just shows a minus sign.</p>
          <p>The low impedance switches off at about 8 V DC. That's no longer a shock risk, but before measuring the capacitance, finish the job with a resistor of about 1 kΩ for a few seconds, then check that the display shows “- - - -” (under 1 V).</p>
          <p class="small-note">Only within the meter's rating: 600 V, or 1000 V on older units. Never on a microwave oven's capacitor, which runs at about 2 kV. Keep your fingers behind the guards until the reading is down.</p>
          <p>On high voltages the meter raises its impedance to protect itself, to about 100 kΩ at 300 V, so it removes energy at roughly a watt. Large, high-voltage capacitors take a while:</p>`,
      },
      {
        title: "Motor capacitors: fans, pumps, washing machines",
        modes: ["capdiode", "autov"],
        html: `<p>Unplug, then discharge the capacitor, because it can hold a mains-level charge. Use AutoV as in the card before this one, finish with a resistor, then disconnect one wire and measure.</p>
          <p>A capacitor more than about 10% below the value printed on it (often “µF ±5%”) is worth replacing, and so is any that's bulging or leaking.</p>`,
      },
      {
        title: "Temperature sensors and thermostats",
        modes: ["ohm", "mv"],
        html: `<p>Many appliances sense temperature with an NTC thermistor. 10 kΩ at 25 °C is common, and the resistance falls as it warms. Measure its resistance, measure the temperature right next to it with the bead probe, and compare with the table in the service manual or datasheet.</p>
          <p>Thermostats and over-temperature cut-outs are just switches: they should beep when cold and read OL when tripped.</p>`,
      },
    ],
  },
  {
    group: "Heating, cooling and water",
    items: [
      {
        title: "Fridge and freezer, overnight",
        modes: ["mv", "rec"],
        html: `<p>Put the bead in the middle of the fridge (in a glass of water if you want food temperature rather than air swings), run the thin lead out through the door seal, choose °C and press <kbd>REC</kbd>. In the morning, step through to MAX and MIN. (AVG is only a rolling average of the last 16 readings, not the overnight mean.)</p>
          <p>A fridge should stay at or below 5 °C (3–5 °C is ideal), and a freezer at −18 °C or colder. Auto power-off is disabled while recording.</p>`,
      },
      {
        title: "Radiators and heating pipes",
        modes: ["mv", "hold"],
        html: `<p>Tape the bead to the pipe going into a radiator, cover it with a scrap of foam or cloth, and let it settle. Hold <kbd>HOLD</kbd> for a second to zero it (Δ), then move it to the pipe coming out: the display now shows the temperature drop across the radiator.</p>
          <p>A radiator with a much smaller drop than its neighbours is taking more than its share of the flow; one with a much bigger drop is starved. That's the measurement used to balance a heating system.</p>`,
      },
      {
        title: "Hot water",
        modes: ["mv"],
        html: `<p>Hold the bead in the stream from the hot tap after running it for a minute. Water stored in a cylinder is usually kept at 60 °C or more to stop Legionella growing, and the tap should reach at least 50 °C within about a minute. Local rules vary.</p>`,
      },
    ],
  },
  {
    group: "Gadgets and low voltage",
    items: [
      {
        title: "Standby current and battery life",
        modes: ["ua"],
        calc: "battery",
        html: `<p>Put the meter in series with the battery. One way is to slip a thin card with foil on each side between the battery and its contact, then clip a probe to each foil. A sleeping gadget typically draws a few microamps. Battery life is roughly capacity ÷ current:</p>`,
      },
      {
        title: "Plug-in power supplies and chargers",
        modes: ["v", "hz"],
        html: `<p>With nothing connected, a simple transformer-type adapter reads well above its label: a “12 V” one can show 15–17 V, and that's normal. Regulated ones read close to the label: USB 4.75–5.25 V, laptop bricks about 19–20 V.</p>
          <p>Doorbell and garden-light transformers give low-voltage AC, 8–24 V: use AC V, and press <kbd>Hz</kbd> to see 50 Hz.</p>`,
      },
      {
        title: "LEDs and diodes",
        modes: ["capdiode"],
        html: `<p>Diode test, red probe on the anode: most red, green and yellow LEDs glow faintly and read their forward voltage, about 1.7–2.2 V. The glow also tells you which leg is which. Blue and white LEDs may read OL, because they need nearly all of the 3.2 V available.</p>
          <p>Test a bridge rectifier as four separate diodes: 0.4–0.9 V one way, OL the other.</p>`,
      },
    ],
  },
];

// ---------- accuracy calculator ----------
// Each range: label, display unit, scale (SI value of one display unit), largest
// magnitude it can show, decimals, and ±(pct% of reading + dig digits).
const r = (label, unit, scale, max, dec, pct, dig, extra = {}) => ({ label, unit, scale, max, dec, pct, dig, ...extra });

const DCV = [r("6.000 V", "V", 1, 5.999, 3, 0.3, 2), r("60.00 V", "V", 1, 59.99, 2, 0.4, 2), r("600.0 V", "V", 1, 600, 1, 0.2, 2)];
const acv = (pct) => [r("6.000 V", "V", 1, 5.999, 3, pct, 3), r("60.00 V", "V", 1, 59.99, 2, pct, 3), r("600.0 V", "V", 1, 600, 1, pct, 3)];
const mv = (pct, dig) => [r("60.00 mV", "mV", 1e-3, 59.99, 2, pct, dig), r("600.0 mV", "mV", 1e-3, 600, 1, pct, dig)];
const OHM = [
  r("600.0 Ω", "Ω", 1, 599.9, 1, 0.3, 3, { min: 0 }),
  r("6.000 kΩ", "kΩ", 1e3, 5.999, 3, 0.3, 3, { min: 0 }),
  r("60.00 kΩ", "kΩ", 1e3, 59.99, 2, 0.5, 3, { min: 0 }),
  r("600.0 kΩ", "kΩ", 1e3, 599.9, 1, 0.5, 3, { min: 0 }),
  r("6.000 MΩ", "MΩ", 1e6, 5.999, 3, 0.9, 2, { min: 0 }),
  r("60.00 MΩ", "MΩ", 1e6, 60, 2, 0.9, 2, { min: 0, above: { at: 30, pct: 5, dig: 20 } }),
];
const CAP = [
  r("20.00 nF", "nF", 1e-9, 19.99, 2, 1.5, 8, { min: 0 }),
  r("200.0 nF", "nF", 1e-9, 199.9, 1, 1.5, 8, { min: 0 }),
  r("2000 nF", "nF", 1e-9, 1999, 0, 1.5, 2, { min: 0 }),
  r("20.00 µF", "µF", 1e-6, 19.99, 2, 1.5, 2, { min: 0 }),
  r("200.0 µF", "µF", 1e-6, 199.9, 1, 1.5, 2, { min: 0 }),
  r("2000 µF", "µF", 1e-6, 1999, 0, 1.5, 2, { min: 0 }),
  r("10.00 mF", "mF", 1e-3, 10, 2, 4.5, 10, { min: 0 }),
];
const UA = "µA position";
const MA = "A mA position, red lead in mA µA";
const AJ = "A mA position, red lead in A";
const amps = (ua, ma) => [
  r("600.0 µA", "µA", 1e-6, 599.9, 1, ua, 3, { where: UA }),
  r("6000 µA", "µA", 1e-6, 5999, 0, ua, 3, { where: UA }),
  r("60.00 mA", "mA", 1e-3, 59.99, 2, ma, 3, { where: MA }),
  r("600.0 mA", "mA", 1e-3, 599.9, 1, ma, 3, { where: MA }),
  r("6.000 A", "A", 1, 5.999, 3, ma, 3, { where: AJ }),
  r("10.00 A", "A", 1, 20, 2, ma, 3, { where: AJ, warn: { at: 10, text: "Above 10 A: 30 seconds at most, then 5 minutes to cool." } }),
];

export const ACCURACY = [
  { id: "dcv", label: "DC volts", input: ["V", 1], example: "12.6", ranges: DCV },
  { id: "acv", label: "AC volts, 50–60 Hz", input: ["V", 1], example: "230", ranges: acv(0.7) },
  { id: "acvw", label: "AC volts, 45–440 Hz", input: ["V", 1], example: "230", ranges: acv(2.0) },
  { id: "dcmv", label: "DC millivolts", input: ["mV", 1e-3], example: "12.5", ranges: mv(0.3, 2) },
  { id: "acmv", label: "AC millivolts, 10–500 Hz", input: ["mV", 1e-3], example: "250", ranges: mv(1.0, 3) },
  { id: "ohm", label: "Resistance", input: ["Ω", 1], example: "4.7k", ranges: OHM },
  { id: "cap", label: "Capacitance", input: ["µF", 1e-6], example: "4.7", ranges: CAP, auto: true },
  { id: "dca", label: "DC current", input: ["mA", 1e-3], example: "38", ranges: amps(1.0, 0.7) },
  { id: "aca", label: "AC current, 50–400 Hz", input: ["mA", 1e-3], example: "120", ranges: amps(1.5, 1.0) },
  {
    id: "temp",
    label: "Temperature, °C",
    input: ["°C", 1],
    example: "4",
    auto: true,
    ranges: [r("−40.0 to 99.9 °C", "°C", 1, 99.9, 1, 1, 10, { min: -40 }), r("100 to 400 °C", "°C", 1, 400, 0, 1, 1, { min: 99.95 })],
    note: "Plus the thermocouple's own tolerance, which Brymen's figure doesn't include.",
  },
];

const PREFIX = { p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6 };

// "4.7k" → 4700; "12" → 12 × the field's own unit (e.g. mA). An SI prefix
// makes the number relative to the base unit instead: "100n" in a µF field is 100 nF.
export function parseReading(text, inputScale = 1) {
  const m = String(text)
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/−/g, "-")
    .match(/^([+-]?(?:\d+\.?\d*|\.\d+))([pnuµμmkKM]?)(?:[a-zA-ZΩ°]*)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] ? n * PREFIX[m[2]] : n * inputScale;
}

const fits = (rg, v) => v <= rg.max + 1e-9 && v >= (rg.min ?? -rg.max) - 1e-9;

// The error band for a reading: which range shows it, and ±(pct% + digits) on that range.
// `pick` is a range index to force (manual ranging), or null for auto.
export function accuracy(fnId, value, pick = null) {
  const fn = ACCURACY.find((f) => f.id === fnId);
  if (!fn || !Number.isFinite(value)) return null;
  const index = pick ?? fn.ranges.findIndex((rg) => fits(rg, value / rg.scale));
  const range = fn.ranges[index];
  if (!range) return { fn, ol: true, index: -1 };
  const shown = value / range.scale;
  if (!fits(range, shown)) return { fn, range, index, ol: true };
  const spec = range.above && Math.abs(shown) > range.above.at ? range.above : range;
  const digit = 10 ** -range.dec;
  const fromPct = (spec.pct / 100) * Math.abs(shown);
  const fromDigits = spec.dig * digit;
  const err = fromPct + fromDigits;
  const k = 10 ** range.dec;
  // Round the band outwards, to whole digits: the true value lies inside it.
  const lo = Math.floor((shown - err) * k + 1e-9) / k;
  const hi = Math.ceil((shown + err) * k - 1e-9) / k;
  return { fn, range, index, shown, digit, pct: spec.pct, dig: spec.dig, fromPct, fromDigits, err, lo, hi, warn: range.warn && Math.abs(shown) > range.warn.at ? range.warn.text : "" };
}

// ---------- ghost voltages ----------
// A disconnected wire in a cable alongside a live conductor and an earthed one.
// Capacitance to each neighbour is about 50 pF per metre; mains is 230 V, 50 Hz.
export const GHOST = { cPerMetre: 50e-12, mains: 230, f: 50 };

const cx = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => {
    const d = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
  },
  abs: (a) => Math.hypot(a[0], a[1]),
};
const capZ = (c, f) => [0, -1 / (2 * Math.PI * f * c)];
const parallel = (a, b) => cx.div(cx.mul(a, b), cx.add(a, b));

// AutoV's input resistance at a given AC voltage, from Brymen's table for a
// voltage applied from rest: over 8 MΩ below about 5.6 V, then 22 kΩ at 7 V,
// 12 kΩ at 8 V, 2.6 kΩ at 50 V, and about 2.1 kΩ on a high voltage.
const LOZ = [
  [5.6, 8e6],
  [7, 22e3],
  [8, 12e3],
  [50, 2.6e3],
  [100, 2.1e3],
];
export function lozResistance(v) {
  if (v <= LOZ[0][0]) return LOZ[0][1];
  for (let i = 1; i < LOZ.length; i++) {
    const [v1, r1] = LOZ[i];
    if (v <= v1) {
      const [v0, r0] = LOZ[i - 1];
      const t = (v - v0) / (v1 - v0);
      return Math.exp(Math.log(r0) + t * (Math.log(r1) - Math.log(r0)));
    }
  }
  return LOZ.at(-1)[1];
}

export function ghost(metres, { cPerMetre, mains, f } = GHOST) {
  const toLive = cPerMetre * metres;
  const toEarth = cPerMetre * metres;
  const open = (mains * toLive) / (toLive + toEarth);
  const source = capZ(toLive + toEarth, f);
  const reading = (rIn, cIn) => {
    const zm = parallel([rIn, 0], capZ(cIn, f));
    return open * cx.abs(cx.div(zm, cx.add(zm, source)));
  };
  const highZ = reading(10e6, 54e-12);
  // In AutoV the load depends on the voltage it sees: find where they agree.
  let lo = 0;
  let hi = open;
  for (let i = 0; i < 60; i++) {
    const v = (lo + hi) / 2;
    if (v > reading(lozResistance(v), 164e-12)) hi = v;
    else lo = v;
  }
  return { open, highZ, lowZ: (lo + hi) / 2, coupling: toLive };
}

// ---------- discharging a capacitor in AutoV ----------
// AutoV's DC input resistance against the voltage it sees, from Brymen's table:
// 25 kΩ at 9 V, 13 kΩ at 10 V, 2.6 kΩ at 50 V, then on a high voltage the
// impedance it settles at: 12 kΩ at 100 V, 100 kΩ at 300 V, 240 kΩ at 600 V and
// (EEVblog manual) 580 kΩ at 1000 V. Below about 8 V it's back to 10 MΩ.
const LOZ_DC = [
  [9, 25e3],
  [10, 13e3],
  [50, 2.6e3],
  [100, 12e3],
  [300, 100e3],
  [600, 240e3],
  [1000, 580e3],
];
export const LOZ_FLOOR = 9;

export function lozDcResistance(v) {
  if (v < 8) return 10e6;
  if (v <= LOZ_DC[0][0]) return LOZ_DC[0][1];
  for (let i = 1; i < LOZ_DC.length; i++) {
    const [v1, r1] = LOZ_DC[i];
    if (v <= v1) {
      const [v0, r0] = LOZ_DC[i - 1];
      const t = Math.log(v / v0) / Math.log(v1 / v0);
      return Math.exp(Math.log(r0) + t * (Math.log(r1) - Math.log(r0)));
    }
  }
  return LOZ_DC.at(-1)[1];
}

// Seconds for AutoV to drain a capacitor from `volts` down to about 9 V, treating the
// input as the resistance it settles at for each voltage: t = C ∫ R(V) dV / V.
export function dischargeTime(farads, volts) {
  if (!(volts > LOZ_FLOOR)) return 0;
  const steps = 400;
  const a = Math.log(LOZ_FLOOR);
  const h = (Math.log(volts) - a) / steps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) sum += (i === 0 || i === steps ? 0.5 : 1) * lozDcResistance(Math.exp(a + i * h));
  return farads * sum * h;
}

// ---------- burden voltage ----------
export const SHUNTS = {
  ua: { r: 100, max: 6e-3, label: "µA position (100 Ω)" },
  ma: { r: 1.9, max: 0.6, label: "mA µA jack (1.9 Ω)" },
  a: { r: 0.04, max: 20, label: "A jack (0.04 Ω)" },
};

// A load that draws `current` from `supply` when connected directly, treated as a
// resistor; with the meter's shunt in series the current and voltage both drop.
export function burden(supply, current, shunt) {
  const rs = SHUNTS[shunt].r;
  const load = supply / current;
  const reading = supply / (load + rs);
  const drop = reading * rs;
  return { load, reading, drop, left: supply - drop, error: (current - reading) / current, over: reading > SHUNTS[shunt].max };
}
