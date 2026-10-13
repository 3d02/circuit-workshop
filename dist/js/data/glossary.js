// Every technical term the course and the BM235 guides use, in plain words.
// In chapter text, [[term]] or [[shown text|term-id]] becomes a tappable term.
// On the BM235 pages, terms are found automatically (first use in each section).
//
// id: stable key · term: how it's written · also: other spellings that match
// def: one to three plain sentences · ch: the chapter that explains it
// bm: the BM235 complete-guide section where it matters on your meter

export const TERMS = [
  // ---------- charge, current, voltage ----------
  { id: "charge", term: "charge", def: "The property that makes particles push or pull on each other. Electrons carry a tiny negative charge, protons an equal positive one. Measured in coulombs (C).", ch: "inside" },
  { id: "coulomb", term: "coulomb", also: ["coulombs"], def: "The unit of charge, C. One coulomb is the charge of about 6.24 × 10¹⁸ electrons.", ch: "inside" },
  { id: "current", term: "current", def: "The net amount of charge flowing past a point each second. Measured in amperes: 1 A is 1 coulomb per second. Symbol I.", ch: "inside" },
  { id: "ampere", term: "ampere", also: ["amperes", "amp", "amps"], def: "The unit of current, A. One ampere is one coulomb of charge passing each second. 1 mA is a thousandth of that.", ch: "inside" },
  { id: "conventional-current", term: "conventional current", def: "Current drawn as flowing from + to −. Electrons in a wire actually drift the other way, but every schematic and formula uses this convention, and the answers come out the same.", ch: "loop" },
  { id: "drift", term: "drift velocity", also: ["drift", "drift speed"], def: "The slow average speed of electrons along a wire when a current flows, typically a small fraction of a millimetre per second, on top of very fast random motion.", ch: "inside" },
  { id: "field", term: "electric field", also: ["field"], def: "The push a charge would feel at each point in space, with a direction and a strength. Measured in volts per metre. In a circuit it is the field that pushes the electrons.", ch: "inside" },
  { id: "surface-charge", term: "surface charge", def: "A very thin layer of extra charge on the outside of a wire, positive near the + end of the battery and negative near the − end. It shapes the field so that it points along the wire.", ch: "inside" },
  { id: "voltage", term: "voltage", also: ["potential difference"], def: "The energy each coulomb of charge gains or loses between two points. Always a difference between two points, like height. Measured in volts: 1 V = 1 joule per coulomb.", ch: "voltage" },
  { id: "volt", term: "volt", also: ["volts"], def: "The unit of voltage, V. One volt means one joule of energy for every coulomb that moves between the two points.", ch: "voltage" },
  { id: "ground", term: "ground", also: ["0 V"], def: "The point in a circuit you choose to call 0 V and measure everything else from. Usually the battery's − terminal. Not necessarily connected to the earth.", ch: "voltage" },
  { id: "kvl", term: "Kirchhoff's voltage law", def: "Going all the way round any loop, the voltage rises and drops add up to zero: everything the sources lift, the parts drop again.", ch: "voltage" },
  { id: "kcl", term: "Kirchhoff's current law", def: "At any junction, the current flowing in equals the current flowing out. Charge doesn't pile up or vanish.", ch: "dividers" },
  { id: "emf", term: "EMF", also: ["electromotive force", "open-circuit voltage"], def: "The voltage a source produces with nothing connected, before any is lost inside it. A battery's terminal voltage is its EMF minus the drop across its internal resistance.", ch: "energy" },
  { id: "internal-resistance", term: "internal resistance", def: "The resistance inside a battery or power supply. The more current you draw, the more voltage is lost inside it, so the terminal voltage sags under load.", ch: "energy" },

  // ---------- resistance, power, energy ----------
  { id: "resistance", term: "resistance", def: "How strongly something opposes current: the voltage needed per ampere. Measured in ohms (Ω). R = V ÷ I.", ch: "resistance" },
  { id: "ohm", term: "ohm", also: ["ohms", "Ω"], def: "The unit of resistance, Ω. One ohm lets one ampere flow for every volt across it. 1 kΩ = 1,000 Ω, 1 MΩ = 1,000,000 Ω.", ch: "resistance" },
  { id: "ohms-law", term: "Ohm's law", def: "For a resistor, current is proportional to voltage: I = V ÷ R. Double the voltage and the current doubles.", ch: "resistance" },
  { id: "resistivity", term: "resistivity", def: "How strongly a material resists current, independent of its shape. Copper's is about 1.7 × 10⁻⁸ Ω·m. A wire's resistance is R = ρL ÷ A.", ch: "resistance" },
  { id: "power", term: "power", def: "How fast energy is converted, in watts: 1 W is 1 joule per second. For any part, P = V × I.", ch: "resistance" },
  { id: "watt", term: "watt", also: ["watts"], def: "The unit of power, W: one joule per second. A phone charger delivers about 5–20 W; a kettle about 2,000 W.", ch: "resistance" },
  { id: "joule", term: "joule", also: ["joules"], def: "The unit of energy, J. Lifting an apple one metre takes about 1 J. One watt for one second is one joule.", ch: "energy" },
  { id: "watt-hour", term: "watt-hour", also: ["Wh", "kWh", "kilowatt-hour"], def: "Energy as power × time: 1 Wh is one watt for an hour, 3,600 J. Your electricity bill counts kilowatt-hours.", ch: "energy" },
  { id: "mah", term: "mAh", also: ["milliamp-hour", "milliamp-hours", "amp-hour", "Ah"], def: "A battery's capacity as charge: 2,000 mAh can supply 2,000 mA for one hour, or 200 mA for ten. Multiply by the voltage to get energy in Wh.", ch: "energy" },
  { id: "efficiency", term: "efficiency", def: "The useful energy out divided by the energy in. The rest becomes heat.", ch: "energy" },
  { id: "power-rating", term: "power rating", def: "The most power a part can turn into heat without damage. Small resistors are usually rated ¼ W. Stay well below it.", ch: "resistance" },
  { id: "tolerance", term: "tolerance", def: "How far a part's real value may be from its marked value. A 1 kΩ ±5% resistor can be anywhere from 950 Ω to 1,050 Ω.", ch: "resistance" },
  { id: "e12", term: "E12 series", also: ["standard values"], def: "The twelve standard resistor values in each decade: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82, then ×10.", ch: "leds" },

  // ---------- circuits ----------
  { id: "short-circuit", term: "short circuit", also: ["short"], def: "An unintended path with almost no resistance. A very large current flows and things heat up fast.", ch: "loop" },
  { id: "open-circuit", term: "open circuit", def: "A break in the path, so no current can flow. The full source voltage appears across the gap.", ch: "loop" },
  { id: "series", term: "in series", also: ["series"], def: "Connected one after another in a single path. The same current flows through each, and their voltages add up.", ch: "dividers" },
  { id: "parallel", term: "in parallel", also: ["parallel"], def: "Connected side by side across the same two points. Each has the same voltage, and their currents add up.", ch: "dividers" },
  { id: "divider", term: "voltage divider", also: ["divider"], def: "Two resistors in series that split a voltage. The output is V_in × R_bottom ÷ (R_top + R_bottom).", ch: "dividers" },
  { id: "loading", term: "loading", def: "Connecting something that draws current from a circuit, which changes the voltages you were trying to use or measure.", ch: "dividers" },

  // ---------- components ----------
  { id: "forward-voltage", term: "forward voltage", also: ["Vf"], def: "The voltage a diode or LED takes for itself when it conducts: about 0.6–0.7 V for a silicon diode, 1.8–3.3 V for LEDs depending on colour.", ch: "leds" },
  { id: "capacitance", term: "capacitance", def: "How much charge a capacitor stores per volt across it, in farads: Q = C × V. Typical values run from picofarads to thousands of microfarads.", ch: "capacitors" },
  { id: "farad", term: "farad", also: ["farads"], def: "The unit of capacitance, F. One farad stores one coulomb per volt, which is huge: most capacitors are µF, nF or pF.", ch: "capacitors" },
  { id: "time-constant", term: "time constant", also: ["τ", "tau"], def: "τ = R × C. After one τ a charging capacitor is 63% of the way there; after five it is effectively done.", ch: "capacitors" },
  { id: "inductance", term: "inductance", def: "How strongly a coil resists a change in its current, in henries. A changing current makes a voltage across it: V = L × (change of current per second).", ch: "transistors" },
  { id: "flyback", term: "flyback diode", def: "A diode across a coil (relay, motor, solenoid) that gives its current a safe path when it's switched off, instead of a voltage spike.", ch: "transistors" },
  { id: "gain", term: "gain", also: ["β", "hFE"], def: "For a bipolar transistor, the collector current divided by the base current, typically 100 to 300. It varies a lot between parts.", ch: "transistors" },
  { id: "saturation", term: "saturation", def: "A bipolar transistor switched fully on: more base current no longer increases the collector current, and only about 0.1–0.2 V is left across it.", ch: "transistors" },
  { id: "threshold", term: "threshold voltage", also: ["Vgs(th)", "VGS(th)"], def: "The gate voltage at which a MOSFET just starts to conduct, at a tiny current. To switch it fully on you need well above it: check the datasheet's R_DS(on) rating.", ch: "transistors" },
  { id: "rdson", term: "R_DS(on)", also: ["RDS(on)", "on-resistance"], def: "A MOSFET's resistance when it's switched fully on, at a stated gate voltage. The heat it makes is I² × R_DS(on).", ch: "transistors" },
  { id: "pwm", term: "PWM", also: ["pulse-width modulation"], def: "Switching something fully on and off quickly, and varying the fraction of time it's on, to control the average power. Used for dimming LEDs and controlling motors.", ch: "transistors" },
  { id: "duty-cycle", term: "duty cycle", def: "The fraction of each cycle a signal spends on. 25% duty means on for a quarter of the time.", ch: "transistors" },
  { id: "datasheet", term: "datasheet", def: "The manufacturer's document for a part: pinout, ratings, typical behaviour and example circuits. The final authority on what a part can do.", ch: "transistors" },
  { id: "abs-max", term: "absolute maximum", also: ["absolute maximum ratings"], def: "Limits that damage the part if exceeded, even briefly. They are not operating targets: design well inside them.", ch: "transistors" },
  { id: "thermal-resistance", term: "thermal resistance", also: ["°C/W"], def: "How many degrees a part heats up for each watt it dissipates. A TO-220 package in still air is roughly 60 °C/W.", ch: "transistors" },

  // ---------- AC ----------
  { id: "dc", term: "DC", also: ["direct current"], def: "Current or voltage that keeps the same direction, like a battery's.", ch: "multimeter" },
  { id: "ac", term: "AC", also: ["alternating current"], def: "Current or voltage that reverses direction many times a second. European mains is 230 V AC at 50 Hz.", ch: "multimeter" },
  { id: "frequency", term: "frequency", also: ["hertz", "Hz"], def: "How many complete cycles happen each second, in hertz (Hz). Mains in Europe is 50 Hz.", ch: "multimeter", bm: "hz" },
  { id: "rms", term: "RMS", also: ["root mean square"], def: "The DC voltage that would heat a resistor the same amount as the AC one. Mains' 230 V is an RMS value; its peaks reach about 325 V.", ch: "multimeter", bm: "acv" },
  { id: "true-rms", term: "True RMS", also: ["true-RMS"], def: "A meter that calculates the real RMS value of any waveform. Cheaper meters assume a perfect sine wave and read wrong on anything else.", ch: "multimeter", bm: "acv" },
  { id: "crest-factor", term: "crest factor", def: "A waveform's peak divided by its RMS value: 1.41 for a clean sine wave, higher for spiky waveforms. A meter stays accurate only up to its stated crest factor.", ch: "multimeter", bm: "acv" },
  { id: "vfd", term: "VFD", also: ["variable-frequency drive"], def: "A motor speed controller that makes a choppy, high-frequency waveform. The BM235's VFD mode filters out the chopping to show the useful part.", ch: "multimeter", bm: "vfd" },

  // ---------- the meter ----------
  { id: "com", term: "COM", also: ["COM jack"], def: "The meter's common socket, for the black lead. Every reading is the red lead measured relative to it.", ch: "multimeter", bm: "glance" },
  { id: "counts", term: "counts", also: ["display counts", "6000 counts", "6000-count", "6,000 counts"], def: "How many different numbers the display can show on one range. The BM235 counts to 6,000, so it shows up to 5.999 V on its 6 V range.", ch: "multimeter", bm: "display" },
  { id: "resolution", term: "resolution", def: "The smallest step the display can show on a range, like 0.001 V. It is not the same as accuracy: a reading can be precise to the last digit and still be off.", ch: "multimeter", bm: "display" },
  { id: "accuracy", term: "accuracy", def: "How far the reading may be from the truth, written ±(% of reading + digits). ±(0.3% + 2) on a 5.000 V reading allows 15 mV + 2 mV, so 4.983 to 5.017 V.", ch: "multimeter", bm: "dcv" },
  { id: "digits", term: "digits", also: ["dg", "dgt"], def: "In an accuracy spec, extra steps of the last displayed digit. “+ 2 digits” on a 6.000 V range means another ±0.002 V.", ch: "multimeter", bm: "dcv" },
  { id: "range", term: "range", also: ["autoranging", "auto-ranging", "manual ranging"], def: "The span a meter is set to measure, such as 6 V or 60 V. Autoranging picks the range for you; manual ranging holds one, which stops the display hopping about.", ch: "multimeter", bm: "range" },
  { id: "ol", term: "OL", also: ["overload"], def: "The display's way of saying the value is too big for the range, or that there's no connection at all in resistance mode.", ch: "multimeter", bm: "display" },
  { id: "input-impedance", term: "input impedance", also: ["10 MΩ input", "impedance"], def: "The resistance a meter puts across whatever it measures in voltage mode, usually 10 MΩ. High, so it draws almost no current; but in very high-resistance circuits even that pulls the voltage down.", ch: "multimeter", bm: "dcv" },
  { id: "burden-voltage", term: "burden voltage", also: ["burden"], def: "The voltage a meter itself takes from the circuit when measuring current, because the current flows through a small resistor inside it. It makes the circuit's current slightly smaller than without the meter.", ch: "multimeter", bm: "ma" },
  { id: "shunt", term: "shunt", also: ["shunt resistor"], def: "A small, precise resistor the current flows through. The meter measures the tiny voltage across it and divides by its resistance: I = V ÷ R.", ch: "multimeter", bm: "ma" },
  { id: "ghost-voltage", term: "ghost voltage", also: ["ghost voltages", "phantom voltage", "stray voltage"], def: "A misleading voltage on a disconnected wire, picked up through capacitance from live wires next to it. It can't supply real current, so a low-impedance (LoZ) reading makes it collapse.", ch: "multimeter", bm: "autov" },
  { id: "capacitive-coupling", term: "capacitive coupling", def: "Two wires that run side by side behave like a small capacitor, so an AC voltage on one makes a little current flow in the other.", ch: "multimeter", bm: "autov" },
  { id: "loz", term: "LoZ", also: ["AutoV", "low impedance", "low-impedance"], def: "The BM235's AutoV position: a low input resistance of about 2 kΩ that makes ghost voltages collapse while a real supply hardly notices. For mains wiring, never for electronics.", ch: "multimeter", bm: "autov" },
  { id: "continuity", term: "continuity", also: ["BeepLit"], def: "Resistance mode with a beeper (and on the BM235 a flashing light) for a near-zero resistance, to check that a wire, fuse or joint connects.", ch: "multimeter", bm: "cont" },
  { id: "diode-test", term: "diode test", def: "The meter pushes a small current through a diode and shows the voltage across it, about 0.5–0.7 V for a working silicon diode one way and OL the other.", ch: "multimeter", bm: "diode" },
  { id: "rel", term: "relative mode", also: ["REL", "Δ", "zero"], def: "Stores the present reading and shows only changes from it. Used to subtract the test leads' own resistance or a starting value.", ch: "multimeter", bm: "rel" },
  { id: "hold", term: "HOLD", def: "Freezes the display so you can read it after taking the probes away.", ch: "multimeter", bm: "hold" },
  { id: "maxmin", term: "MAX/MIN", also: ["MAX MIN", "AVG", "recording"], def: "Records the highest, lowest or average reading while you leave the meter connected, for catching dips and spikes.", ch: "multimeter", bm: "rec" },
  { id: "ncv", term: "EF", also: ["NCV", "non-contact voltage"], def: "Senses the electric field around a live mains wire without touching it, and beeps. Good for tracing; never proof that something is dead.", ch: "multimeter", bm: "ef" },
  { id: "thermocouple", term: "thermocouple", also: ["type K", "K-type"], def: "Two different metals joined at the tip. Heating the joint makes a small voltage (about 41 µV per °C for type K), which the meter converts to temperature.", ch: "multimeter", bm: "temp" },
  { id: "cat", term: "CAT rating", also: ["CAT II", "CAT III", "CAT IV", "measurement category"], def: "How large a voltage spike a meter is built to survive, by where you use it: CAT II at sockets, CAT III in the fuse box, CAT IV at the incoming supply. Current BM235s are rated CAT III 600 V and CAT IV 300 V.", ch: "multimeter", bm: "glance" },
  { id: "transient", term: "transient", also: ["voltage spike", "spike"], def: "A brief spike far above the normal voltage, for example from lightning or a motor switching off. Closer to the incoming supply, spikes carry more energy.", ch: "multimeter", bm: "glance" },
  { id: "hrc-fuse", term: "HRC fuse", also: ["high rupture capacity", "HRC"], def: "A fuse built to break a huge fault current safely, without exploding or arcing on. Meters for mains use need them; never replace one with an ordinary glass fuse.", ch: "multimeter", bm: "fuses" },
  { id: "beep-jack", term: "Beep-Jack", also: ["InEr"], def: "The BM235's warning (and “InEr” on the display) when the red lead is in a current jack but the dial isn't on a current position: the classic way to blow a fuse.", ch: "multimeter", bm: "beepjack" },
  { id: "apo", term: "auto power-off", also: ["APO"], def: "The meter switches itself off after a period with no button presses or dial changes, to save the battery.", ch: "multimeter", bm: "apo" },

  // ---------- mains ----------
  { id: "live", term: "live", also: ["line", "phase", "L"], def: "The mains conductor at 230 V AC relative to earth. In the Netherlands usually a brown wire.", ch: "multimeter" },
  { id: "neutral", term: "neutral", also: ["N"], def: "The mains return conductor, joined to earth at the supply, so it sits close to 0 V. Usually blue. Never assume it's safe to touch.", ch: "multimeter" },
  { id: "earth", term: "protective earth", also: ["earth", "PE"], def: "The green-and-yellow safety conductor connected to metal cases. It normally carries no current; it's there so a fault blows a fuse or trips the RCD.", ch: "multimeter" },
  { id: "rcd", term: "RCD", also: ["aardlekschakelaar", "residual current device"], def: "A switch in the fuse box that compares the current going out on live with the current coming back on neutral, and cuts the power if more than about 30 mA goes missing, for example through a person.", ch: "multimeter" },
  { id: "prove-test-prove", term: "prove–test–prove", also: ["prove-test-prove", "live-dead-live"], def: "The safe way to check that something is dead: prove the meter works on a known live source, test the circuit, then prove the meter again. A dead meter reads 0 V too.", ch: "multimeter", bm: "autov" },
];

const norm = (s) => String(s).toLowerCase().replace(/[‐-–—]/g, "-").replace(/\s+/g, " ").trim();

const BY_NAME = new Map();
for (const t of TERMS) for (const n of [t.term, ...(t.also || [])]) BY_NAME.set(norm(n), t);
const BY_ID = new Map(TERMS.map((t) => [t.id, t]));

export function findTerm(nameOrId) {
  return BY_ID.get(nameOrId) || BY_NAME.get(norm(nameOrId)) || BY_NAME.get(norm(nameOrId).replace(/s$/, ""));
}

// Every way a term can be written, longest first, for automatic linking.
export const SPELLINGS = [...BY_NAME.keys()].sort((a, b) => b.length - a.length);
