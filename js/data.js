/* Keep the Light — content data. Pure data, no DOM. Loaded in the browser as window.KTL_DATA and in Node via require. */
(function (root) {
'use strict';

const START_YEAR = 1890, END_YEAR = 1990, GATE_YEAR = 1930;

/* Eras: the economy changes shape, not just the numbers. */
const ERAS = [
  { id: 1, name: 'The Oil Years', from: 1890, to: 1914, costScale: 1, fuelName: 'Oil', fuelUnit: 'gal', fuelPrice: 0.40, clickFuel: 6, clickLabel: 'Haul oil up the stair', blurb: 'Four wicks, a clockwork, and the oil you carry up a hundred and twelve steps.' },
  { id: 2, name: 'Flame to Filament', from: 1914, to: 1945, costScale: 1.6, fuelName: 'Paraffin', fuelUnit: 'gal', fuelPrice: 0.55, clickFuel: 10, clickLabel: 'Pump the paraffin', blurb: 'War, wireless, the hiss of vapour burners, and then the first bulb.' },
  { id: 3, name: 'The Electric Coast', from: 1945, to: 1990, costScale: 4, fuelName: 'Power', fuelUnit: 'kWh', fuelPrice: 0.20, clickFuel: 25, clickLabel: 'Walk the gallery', blurb: 'Mains, radar, helicopters, and a letter from the Board with the word "automation" in it.' }
];

/* Prestige headlands. The first run is always Carrow Point. */
const HEADLANDS = {
  carrow: { id: 'carrow', name: 'Carrow Point', region: 'North Sea coast', unlockedBy: null,
    desc: 'A sandstone tower on a tidal rock. Herring, colliers, fog in spring. The light your family kept first.',
    mods: {} },
  skerra: { id: 'skerra', name: 'Skerra Head', region: 'Ice coast', unlockedBy: 'any',
    desc: 'Granite, gales, and ice on the inside of the glass. Fewer ships, each one desperate. The Board pays its respects.',
    mods: { fuelUse: 1.35, traffic: 0.8, standingRate: 1.4, villageGrowth: 0.7, stormWeight: 2.5, winterBite: true } },
  api: { id: 'api', name: 'Pulau Api', region: 'Monsoon strait', unlockedBy: 'any',
    desc: 'A white tower on a reef in a strait that never empties. Squalls, haze, and more ships than you can count.',
    mods: { traffic: 1.5, wreck: 1.5, fuelPrice: 1.3, villageGrowth: 1.3, fogWeight: 2.0 } },
  fer: { id: 'fer', name: 'Cap Fer', region: 'Contested coast', unlockedBy: 'legend',
    desc: 'A frontier light that changed hands twice before you were born. Mines in the bay, dues paid in gold, and a war never quite over.',
    mods: { wreck: 1.3, dues: 1.5, salary: 1.2, warWeight: 3.0, alwaysWar: true } }
};

/*
 Upgrades. cost is in funds unless standing is given too. era = minimum era. year = minimum year (optional).
 eff keys (all multiplicative unless noted):
   fuelEff (fuel use ×), range (light ×, drives dues and village), supplyAdd (+fuel/day auto-bought), storeAdd (+capacity),
   clickMult, salaryAdd (+funds/day), speed (calendar ×), villageGrowth, villageCapAdd, wreck (wreck chance ×), dues,
   standingRate, trade (village income ×), stormShield (storm event cost ×), rescue (wrecks become rescues), standby (never dark),
   mains (power is bought automatically), legend (+legend points), auto (+automation points)
 max = how many times it can be bought (default 1); costMult applies per repeat. heirloom = may be carried to the next headland.
*/
const UPGRADES = [
  // ---- Era 1: The Oil Years ----
  { id: 'wick', name: 'Trimmed wicks', era: 1, cost: 10, cat: 'Lamp', eff: { fuelEff: 0.9 }, desc: 'Trim the four wicks on the hour, not when you remember. A tenth less oil, a steadier flame.' },
  { id: 'store', name: 'Oil store', era: 1, cost: 15, costMult: 2.4, max: 4, cat: 'Stores', eff: { storeAdd: 40 }, desc: 'Another rack of casks under the stair. Forty gallons each.' },
  { id: 'contract', name: 'Supply contract', era: 1, cost: 30, costMult: 2.6, max: 4, cat: 'Stores', eff: { supplyAdd: 0.6 }, heirloom: true, desc: 'A standing order with the chandler at Harrow: oil lands on the rock without you asking, paid from the station purse.' },
  { id: 'garden', name: 'Kitchen garden', era: 1, cost: 45, cat: 'Station', eff: { salaryAdd: 0.3 }, desc: 'Ada says the salt can try. Potatoes, kale, and a little less spent at the chandler.' },
  { id: 'routine', name: 'Steady routine', era: 1, cost: 70, cat: 'Keepers', eff: { speed: 1.2 }, heirloom: true, desc: 'Watches, meals, trimming, logging: the same every day until the days run together. The years go quicker when the work is steady.' },
  { id: 'cottage', name: "Keeper's cottage", era: 1, cost: 80, cat: 'Station', eff: { villageCapAdd: 60, villageGrowth: 1.15 }, desc: 'A proper cottage on the landward side. Room for an assistant, and a chimney the village can see.' },
  { id: 'argand', name: 'Argand burner', era: 1, cost: 60, cat: 'Lamp', eff: { range: 1.25 }, desc: 'Concentric wicks and a glass chimney. The flame stands up and stops smoking the lens.' },
  { id: 'barometer', name: 'Barometer and log rules', era: 1, cost: 40, cat: 'Keepers', eff: { stormShield: 0.6 }, desc: 'Read the glass at six and six. A storm you saw coming costs half what a storm that caught you did.' },
  { id: 'flags', name: 'Signal flags', era: 1, cost: 90, cat: 'Signals', eff: { dues: 1.2 }, desc: 'A hoist on the gallery. Pilots pay better for a light that can also talk.' },
  { id: 'bell', name: 'Fog bell', era: 1, cost: 100, cat: 'Signals', eff: { wreck: 0.6 }, heirloom: true, desc: 'A half-ton bell on a frame, struck by clockwork every thirty seconds. Fog is no longer silence.' },
  { id: 'assistant', name: 'Assistant keeper', era: 1, cost: 120, req: ['cottage'], cat: 'Keepers', eff: { speed: 1.15, fuelEff: 0.95, keepers: 1 }, desc: 'A second pair of hands and a second name on the log. Watches halve; sleep returns.' },
  { id: 'fresnel4', name: 'Fresnel lens, 4th order', era: 1, cost: 150, cat: 'Lamp', eff: { range: 1.5 }, heirloom: true, desc: 'Birmingham glass at last. Rings of prisms gather the flame into a blade.' },
  { id: 'landing', name: 'Landing stage', era: 1, cost: 180, cat: 'Station', eff: { supplyAdd: 0.8, villageGrowth: 1.2 }, desc: 'Stone steps and an iron ring on the lee side. The tender can land in anything short of a gale.' },
  { id: 'clockwork', name: 'Clockwork rotation', era: 1, cost: 200, cat: 'Lamp', eff: { range: 1.3, speed: 1.1 }, heirloom: true, desc: 'A weight down the tower turns the lens: one flash every twenty seconds, Carrow\'s own character.' },
  { id: 'storeroom', name: 'Store room', era: 1, cost: 250, cat: 'Stores', eff: { storeAdd: 150 }, desc: 'A vaulted room cut into the rock. Cool, dry, and big enough to sleep through a siege.' },
  { id: 'telegraph', name: 'Telegraph line', era: 1, cost: 350, year: 1895, cat: 'Signals', eff: { dues: 1.15, salaryAdd: 0.5 }, desc: 'A cable to the Harrow post office. The Board can reach you now, which is less of a gift than it sounds.' },
  { id: 'vapour', name: 'Pressure vapour burner', era: 1, cost: 400, year: 1901, cat: 'Lamp', eff: { fuelEff: 0.7, range: 1.3 }, desc: 'Oil vaporised under pressure and burned on a mantle. Hisses like it knows something. Half the oil, more light.' },
  { id: 'tender', name: 'Oil tender contract', era: 1, cost: 450, req: ['landing'], cat: 'Stores', eff: { supplyAdd: 2 }, desc: 'The Board\'s own tender calls monthly. Casks by the dozen.' },
  { id: 'harbourwall', name: 'Harbour wall', era: 1, cost: 500, cat: 'Village', eff: { villageGrowth: 1.5, villageCapAdd: 200, dues: 1.2 }, desc: 'The village builds it; you lend the station\'s credit and its derrick. Boats winter inside now.' },
  { id: 'assistant2', name: 'Second assistant', era: 1, cost: 600, req: ['assistant'], cat: 'Keepers', eff: { speed: 1.15, keepers: 1 }, desc: 'Three keepers, three watches, a proper station. The Board sends a third bed and a letter about economy.' },
  { id: 'lifeboat', name: 'Lifeboat station', era: 1, cost: 700, needStanding: 60, req: ['harbourwall'], cat: 'Village', eff: { rescue: true, legend: 1 }, heirloom: true, desc: 'A boathouse, a slip, and twelve volunteers who will row into anything. A wreck is not the end of the story any more.' },
  { id: 'fresnel2', name: 'Fresnel lens, 2nd order', era: 1, cost: 800, req: ['fresnel4'], cat: 'Lamp', eff: { range: 1.6 }, desc: 'Six feet of glass in a brass cage. On a clear night the beam touches Shale Point.' },
  { id: 'cistern', name: 'Rain cistern', era: 1, cost: 220, cat: 'Station', eff: { salaryAdd: 0.4, villageGrowth: 1.1 }, desc: 'No more water by boat. The cistern under the yard holds a dry summer.' },
  { id: 'library', name: 'Station library', era: 1, cost: 130, cat: 'Keepers', eff: { standingRate: 1.15 }, desc: 'A crate of books from the Seamen\'s Mission. Keepers who read write better logs, and the Board reads the logs.' },

  // ---- Era 2: Flame to Filament ----
  { id: 'paraffin', name: 'Paraffin conversion', era: 2, cost: 900, cat: 'Lamp', eff: { fuelEff: 0.8 }, desc: 'The Board calls it petroleum vapour. Brighter, meaner, cheaper by the gallon.' },
  { id: 'shutters', name: 'Storm shutters', era: 2, cost: 800, cat: 'Station', eff: { stormShield: 0.6 }, desc: 'Iron shutters for the lantern and the cottage. A gale is a noise now, not a bill.' },
  { id: 'wireless', name: "Keepers' wireless", era: 2, cost: 400, year: 1920, cat: 'Keepers', eff: { speed: 1.1, standingRate: 1.1 }, desc: 'A valve set in the kitchen. The King\'s voice in a lighthouse. Father would have switched it off.' },
  { id: 'dieseltanks', name: 'Fuel tanks', era: 2, cost: 1200, cat: 'Stores', eff: { storeAdd: 500 }, desc: 'Two riveted tanks in the yard. Fuel by the ton, not the cask.' },
  { id: 'foghorn', name: 'Diaphone foghorn', era: 2, cost: 1500, cat: 'Signals', eff: { wreck: 0.4 }, heirloom: true, desc: 'Compressed air through a slotted piston. Every dog for a mile howls; every pilot for ten blesses it.' },
  { id: 'school', name: 'Village school', era: 2, cost: 1500, needStanding: 120, cat: 'Village', eff: { villageGrowth: 1.3, legend: 1 }, desc: 'The station gives the land and the first year\'s coal. Families stay where there is a school.' },
  { id: 'rota', name: 'Relief keeper rota', era: 2, cost: 1600, req: ['assistant'], cat: 'Keepers', eff: { speed: 1.2 }, heirloom: true, desc: 'A month on, a fortnight ashore. Keepers who see their families keep better lights.' },
  { id: 'launch', name: 'Motor launch', era: 2, cost: 1800, req: ['landing'], cat: 'Stores', eff: { supplyAdd: 4, villageGrowth: 1.2 }, desc: 'Twelve horsepower and a tarpaulin. Harrow and back between watches.' },
  { id: 'generator', name: 'Generator house', era: 2, cost: 2000, year: 1920, cat: 'Lamp', eff: { fuelEff: 0.6 }, heirloom: true, desc: 'Three weeks of noise and swearing, then a hum under the tower. The lamp room is wired and waiting.' },
  { id: 'pension', name: "Keepers' pension fund", era: 2, cost: 2000, needStanding: 150, cat: 'Keepers', eff: { standingRate: 1.3 }, desc: 'A penny in the pound and a letter to the Board. Men who are looked after stay thirty years.' },
  { id: 'mercury', name: 'Mercury float', era: 2, cost: 2200, req: ['clockwork'], cat: 'Lamp', eff: { range: 1.3, speed: 1.1 }, desc: 'The lens floats on a bath of mercury and turns at a finger\'s touch. One flash every ten seconds now.' },
  { id: 'electric', name: 'Electric lamp', era: 2, cost: 2500, req: ['generator'], cat: 'Lamp', eff: { range: 2.0, fuelEff: 0.8, electrified: true }, desc: 'A bulb the size of a jam jar does in one night what four wicks did in a week. Electrification.' },
  { id: 'fishmarket', name: 'Fish market', era: 2, cost: 2500, req: ['harbourwall'], cat: 'Village', eff: { trade: 1.5 }, desc: 'A roof over the quay and a bell at six. Buyers come from Harrow; money stays in the village.' },
  { id: 'radio', name: 'Radio beacon', era: 2, cost: 3000, year: 1928, req: ['generator'], cat: 'Signals', eff: { dues: 1.3, wreck: 0.8 }, desc: 'Three dots and a dash, every minute, in any weather. Ships find you with their eyes shut.' },
  { id: 'lorry', name: 'Supply by road', era: 2, cost: 3500, year: 1925, cat: 'Stores', eff: { supplyAdd: 6 }, desc: 'The council metals the cliff road. A lorry does in an hour what the tender did in a month.' },
  { id: 'dredging', name: 'Harbour dredging', era: 2, cost: 4000, req: ['harbourwall'], cat: 'Village', eff: { villageGrowth: 1.5, dues: 1.3, villageCapAdd: 500 }, desc: 'Steamers can lie alongside at any tide. The village becomes a port.' },
  { id: 'reglaze', name: 'Lantern re-glazing', era: 2, cost: 1000, cat: 'Lamp', eff: { range: 1.15 }, desc: 'New plate glass, diamond-paned, and a gallery you can stand on in a gale.' },
  { id: 'blackout', name: 'Blackout drill', era: 2, cost: 1000, year: 1938, cat: 'Signals', eff: { warShield: 0.5 }, desc: 'Fittings to show the light on signal and hide it in seconds. War, when it comes, will find the station ready.' },
  { id: 'changer', name: 'Automatic lamp changer', era: 2, cost: 5000, year: 1935, req: ['electric'], cat: 'Lamp', eff: { speed: 1.3, fuelEff: 0.9, auto: 1 }, desc: 'A spare bulb swings in when the first one dies. The first thing the light ever did without a keeper.' },

  // ---- Era 3: The Electric Coast ----
  { id: 'telephone', name: 'Telephone', era: 3, cost: 6000, cat: 'Signals', eff: { salaryAdd: 3, dues: 1.1 }, desc: 'A black telephone on the kitchen wall with a direct line to the coastguard. Eleven minutes is a lifeboat launched.' },
  { id: 'weather', name: 'Weather station', era: 3, cost: 7000, cat: 'Keepers', eff: { stormShield: 0.5, salaryAdd: 2 }, desc: 'The Met Office pays for readings at six and six. You have been taking them for sixty years.' },
  { id: 'mains', name: 'Mains electricity', era: 3, cost: 8000, year: 1950, req: ['electric'], cat: 'Lamp', eff: { mains: true, fuelEff: 0.5 }, desc: 'A cable from the shore. The generator house becomes a storeroom and the light never wants for power again.' },
  { id: 'radar', name: 'Radar reflector', era: 3, cost: 9000, cat: 'Signals', eff: { dues: 1.3 }, desc: 'A steel lattice on the gallery that paints the tower on every ship\'s screen.' },
  { id: 'birds', name: 'Bird observatory', era: 3, cost: 9000, cat: 'Village', eff: { villageGrowth: 1.3, trade: 1.2, legend: 1 }, desc: 'The naturalists who counted the bird-falls want a hut and a ringing station. The village gets a guesthouse.' },
  { id: 'standby', name: 'Standby generator', era: 3, cost: 10000, req: ['mains'], cat: 'Lamp', eff: { standby: true }, desc: 'When the mains fail, the diesel catches before the lens has stopped turning. The light does not go dark again.' },
  { id: 'union', name: "Keepers' association", era: 3, cost: 5000, needStanding: 200, cat: 'Keepers', eff: { standingRate: 1.5 }, desc: 'Every keeper on the coast, one letterhead. The Board answers letters now.' },
  { id: 'sealed', name: 'Sealed-beam array', era: 3, cost: 12000, year: 1960, req: ['mains'], cat: 'Lamp', eff: { range: 2.5, auto: 1 }, desc: 'Banks of sealed lamps on a rotating frame. No lens to polish; nothing a keeper can do for it but watch.' },
  { id: 'oral', name: 'Oral history project', era: 3, cost: 12000, needStanding: 250, year: 1965, cat: 'Village', eff: { legend: 2, standingRate: 1.1 }, desc: 'A woman from the university with a tape recorder. A century of logbook, read aloud by the people in it.' },
  { id: 'automation', name: 'Automation study', era: 3, cost: 15000, year: 1962, cat: 'Signals', eff: { speed: 1.5, auto: 3 }, desc: 'You help the engineers understand the station. They write it all down. The years go very quickly now.' },
  { id: 'helipad', name: 'Helicopter pad', era: 3, cost: 15000, year: 1965, cat: 'Station', eff: { supplyAdd: 20, speed: 1.2 }, desc: 'Forty years of the boat and now the sky. Relief in eleven minutes from Harrow.' },
  { id: 'racon', name: 'Racon beacon', era: 3, cost: 18000, year: 1960, cat: 'Signals', eff: { dues: 1.4, wreck: 0.6 }, desc: 'Answers every radar that asks, with a Morse letter. The tower\'s name, written on the sea.' },
  { id: 'cottages', name: "Keepers' cottage row", era: 3, cost: 20000, needStanding: 400, cat: 'Village', eff: { villageGrowth: 1.5, legend: 3 }, desc: 'Four cottages on the landward slope for keepers\' families. A station that is a home is a station that is argued for.' },
  { id: 'lifeboat2', name: 'Fast lifeboat', era: 3, cost: 22000, needStanding: 300, req: ['lifeboat'], cat: 'Village', eff: { wreck: 0.3, legend: 1 }, desc: 'Twin diesels and a self-righting hull. The old boathouse keeps the old boat, out of respect.' },
  { id: 'visitors', name: "Visitors' centre", era: 3, cost: 25000, needStanding: 350, year: 1970, cat: 'Village', eff: { trade: 2.0, legend: 2 }, desc: 'Four hundred people climb the stair in an afternoon and every one asks if it is lonely. It is not lonely. It is quiet.' },
  { id: 'marina', name: 'Harbour marina', era: 3, cost: 30000, req: ['dredging'], cat: 'Village', eff: { villageGrowth: 2.0, trade: 1.3, villageCapAdd: 2000 }, desc: 'Pontoons where the herring fleet lay. The village is a town with a lighthouse in it.' },
  { id: 'solar', name: 'Solar panels', era: 3, cost: 35000, year: 1980, cat: 'Lamp', eff: { fuelEff: 0.5, auto: 1 }, desc: 'Glass on the roof of the generator house. Power from the sky on the days there is sky.' },
  { id: 'heritage', name: 'Heritage listing', era: 3, cost: 40000, needStanding: 700, year: 1980, cat: 'Village', eff: { legend: 3, standingRate: 1.2 }, desc: 'People with clipboards want to list the tower. You want them to list the keepers. You compromise on tea.' },
  { id: 'satnav', name: 'Satellite fix', era: 3, cost: 45000, year: 1985, cat: 'Signals', eff: { dues: 1.5, auto: 1 }, desc: 'The ships know where they are now, to the yard, from space. They still look for the light.' },
  { id: 'endowment', name: 'Village endowment', era: 3, cost: 20000, costMult: 1.5, max: 10, needStanding: 300, cat: 'Village', eff: { legend: 1, standingRate: 1.05 }, desc: 'The station\'s surplus, given back: a reading room, a nurse, a boat for the school. A century of light, spent on the people who lived by it.' },
  { id: 'works', name: 'Parish works', era: 3, cost: 25000, costMult: 1.35, max: 12, year: 1955, cat: 'Village', eff: { villageCapAdd: 250, standingRate: 1.03 }, desc: 'A sea wall, a bus shelter, a roof for the chapel, a road that does not flood. Nobody thanks the light for a drain. The drain is there because of the light.' },
  { id: 'fund', name: "Keepers' widows fund", era: 3, cost: 500, costMult: 1.02, max: 100, year: 1985, req: ['satnav'], cat: 'Village', eff: { standingRate: 1.005 }, desc: 'A subscription for the families of keepers who did not come down the stair. Every coast has a list of names. You pay in so this one stays short.' },
  { id: 'museum', name: 'Lamp-room museum', era: 3, cost: 60000, needStanding: 900, year: 1984, req: ['heritage'], cat: 'Village', eff: { legend: 2, trade: 1.1 }, desc: 'The old oil cans, the butter knives, the mooring rope, and a hundred years of logbook under glass. The keepers are in it. So is the kettle.' }
];

/*
 Events. Fired only during active play. window: [fromYear, toYear]. once: true fires at most once per run.
 Choice effects: fuel, funds, standing, village, shipsSaved, keepersRaised, dark (nights the light is forced out),
   mod: {key, mult, days} (temporary), flag: name, grant: upgradeId, chance: {p, then, else}, log: text for the logbook.
 cond: 'fuelHigh' (store over half), 'lifeboat', 'keepers2', 'village:N', 'flag:name', '!flag:name'
 Every choice that gains something also costs or risks something (tests/engine.test.js holds this); a plain refusal may do nothing.
*/
const EVENTS = [
  { id: 'storm', name: 'A southwesterly gale', weight: 5, window: [1890, 1990], tags: ['storm'],
    text: 'The glass has been falling since noon. By dark the sea is over the landing and the tower hums like a struck bell.',
    choices: [
      { label: 'Double the watch and burn full', eff: { fuel: -12, standing: 3, log: 'Gale all night. Doubled the watch and burned full. No ship came near the bank, which is what a light is for.' } },
      { label: 'Shutter the lantern and ride it out', eff: { dark: 2, funds: 10, log: 'Shuttered the lantern against the gale. Two nights dark. I will not do that again.' } },
      { label: 'Send the assistant to warn the harbour', cond: 'keepers2', eff: { fuel: -6, village: 4, standing: 2, log: 'Sent the lad over the rocks to the harbour before the worst of it. The fleet stayed in. Nobody drowned tonight.' } }
    ] },
  { id: 'fog', name: 'Fog for a week', weight: 4, window: [1890, 1990], tags: ['fog'],
    text: 'It came in on Tuesday and has not lifted. You can hear ships you cannot see.',
    choices: [
      { label: 'Ring the bell every quarter hour, day and night', eff: { funds: -8, standing: 4, log: 'Fog a week. Rang the bell by the quarter until my arm went. A collier answered with her whistle. I do not know if she heard me or the rocks.' } },
      { label: 'Trust the lamp', eff: { chance: { p: 0.5, then: { standing: -6, log: 'Trusted the lamp in the fog. A schooner touched the bank and got off on the tide, with a hole in her and a letter about me on its way to the Board.' }, else: { standing: 1, log: 'Fog a week. Trusted the lamp. Nothing struck. I am not proud of the arithmetic.' } } } }
    ] },
  { id: 'inspector', name: 'The inspector, unannounced', weight: 3, window: [1890, 1990],
    text: 'A Board launch at the landing and a man in a bowler hat with a white glove.',
    choices: [
      { label: 'Show him everything', eff: { chance: { p: 0.0, cond: 'fuelHigh', then: { standing: 6, log: 'Inspector ran a white glove along the lantern brass and found nothing, and seemed sorry. Stores full. Good report.' }, else: { standing: -5, log: 'Inspector found the store a third empty and wrote it down slowly. We will hear about it.' } } } },
      { label: 'Keep him talking in the kitchen', eff: { funds: -5, standing: 1, log: 'Gave the inspector tea and the history of the tower until his launch had to catch the tide. He saw the kitchen. The kitchen was spotless.' } }
    ] },
  { id: 'survivors', name: 'Survivors ashore', weight: 3, window: [1890, 1990],
    text: 'Four men and a boy, soaked through, from a boat that broke up off Shale Point. Not your bank, but your door.',
    choices: [
      { label: 'Shelter them at the station', eff: { funds: -15, standing: 4, village: 2, log: 'Took in five from the Shale Point wreck. Fed them from the stores. The boy slept in the lamp room because he would not sleep anywhere he could not see a light.' } },
      { label: 'Send them to the village', eff: { village: 4, standing: -2, log: 'Sent the Shale Point survivors to the village with a lantern. The village took them in without asking whose they were. The Board\'s report says a station door should have been opened.' } }
    ] },
  { id: 'chandler', name: 'A chandler with a bargain', weight: 3, window: [1890, 1945],
    text: 'A coaster lies off the point with oil to sell, cheap, no questions, before the tide turns.',
    choices: [
      { label: 'Buy it', eff: { funds: -40, fuel: 100, log: 'Bought a hundred gallons off a coaster for less than the chandler charges for sixty. Did not ask where it came from. It burns.' } },
      { label: 'Decline', eff: { standing: 1, funds: -15, log: 'A coaster offered cheap oil. Declined. The Board\'s oil is dearer and comes with no questions in it.' } }
    ] },
  { id: 'smugglers', name: 'A quiet word', weight: 2, window: [1890, 1925], once: true,
    text: 'Two men from no village you know ask, politely, that the light be out on Thursday. Just Thursday. For a consideration.',
    choices: [
      { label: 'Refuse', eff: { flag: 'refused_smugglers', chance: { p: 0.4, then: { standing: 4, fuel: -20, log: 'Two men asked for a dark Thursday. Refused. On Thursday night someone stove in the oil store. Twenty gallons on the shingle, and the light burned anyway.' }, else: { standing: 4, log: 'Two men asked for a dark Thursday. Refused. One of them looked at the stairs for a long time before he left.' } } } },
      { label: 'Take the money', eff: { funds: 80, dark: 1, standing: -3, flag: 'took_bribe', log: 'Thursday. The light was out from midnight to four. I have written nothing else for that night and never will.' } }
    ] },
  { id: 'salvage', name: 'Timber on the beach', weight: 3, window: [1890, 1960],
    text: 'A wreck\'s cargo of Baltic timber is coming ashore in the bay, plank by plank.',
    choices: [
      { label: 'Salvage it for the station', eff: { funds: 80, standing: -2, log: 'Stacked forty planks of Baltic pine in the yard. The Receiver of Wreck will hear of it. The yard needed a shed.' } },
      { label: 'Report it to the Receiver', eff: { standing: 5, village: -4, log: 'Reported the timber to the Receiver of Wreck. He thanked me in a letter so formal I had it framed. The village has not forgiven me the timber.' } },
      { label: 'Let the village have it', eff: { village: 12, standing: -4, log: 'Looked the other way while the village took the timber. Three new roofs by Easter. One of them is the schoolroom. The Receiver has heard, and written.' } }
    ] },
  { id: 'relief_late', name: 'The relief is late', weight: 3, window: [1890, 1965],
    text: 'A week past the day and no tender. The stores are thinner than the log admits.',
    choices: [
      { label: 'Eke out the oil', eff: { mod: { key: 'range', mult: 0.8, days: 14 }, log: 'Relief a week late. Trimmed the lamp down to make the oil last. A short light is better than none.' } },
      { label: 'Burn full and trust the tender', eff: { fuel: -20, standing: 2, log: 'Relief a week late. Burned full regardless. The tender came on the ninth day; the store had eleven gallons in it.' } }
    ] },
  { id: 'lad', name: 'A lad from the village', weight: 2, window: [1890, 1980],
    text: 'A boy of fourteen at the door at six in the morning, asking to be taken on. He has been watching the light since he could walk.',
    choices: [
      { label: 'Train him', eff: { funds: -40, keepersRaised: 1, standing: 2, log: 'Took on a village lad. He wound the clockwork on the first morning without being shown. There is a keeper in him.' } },
      { label: 'Send him home', eff: { log: 'A lad asked to be taken on. Sent him home. He was back at six the next day. He is sweeping the yard now, unpaid, and winning.' } }
    ] },
  { id: 'prism', name: 'A cracked prism', weight: 2, window: [1890, 1960],
    text: 'A hairline across one prism of the lens, found at dawn. The beam has a shadow in it.',
    choices: [
      { label: 'Order a new one from Birmingham', eff: { funds: -120, log: 'Ordered a prism from Birmingham. Eight weeks and a bill like a ransom. The beam is whole again.' } },
      { label: 'Patch it and live with the shadow', eff: { mod: { key: 'range', mult: 0.9, days: 120 }, log: 'Patched the cracked prism with putty and a prayer. There is a shadow in the beam at 212 degrees. Pilots have been told.' } }
    ] },
  { id: 'painter', name: 'A painter asks to lodge', weight: 2, window: [1890, 1939],
    text: 'A thin man with an easel wants the spare room for a season. He will pay, and he will paint.',
    choices: [
      { label: 'Take him in', eff: { funds: 30, standing: -2, log: 'A painter lodged a season. His picture of the tower in fog hangs in a gallery in London now, they say. He left owing a week. The Board does not approve of lodgers, and said so.' } },
      { label: 'No lodgers', eff: { log: 'A painter asked to lodge. No lodgers at a light station. He painted the tower from the harbour instead, every day, in all weathers.' } }
    ] },
  { id: 'marry', name: 'The assistant wishes to marry', weight: 2, window: [1890, 1960], cond: 'keepers2',
    text: 'He has asked a village girl and she has said yes. They want the cottage.',
    choices: [
      { label: 'Give them the cottage', eff: { village: 6, standing: 2, keepersRaised: 1, funds: -25, log: 'The assistant married a harbour girl. Gave them the cottage. There will be a child in the lamp room within the year, I expect. There always is. Furnished it out of the station\'s pocket.' } },
      { label: 'The cottage is for the Principal', eff: { standing: -2, log: 'Refused the assistant the cottage. He married anyway and lives in the village and is late for the morning watch. I may have been wrong.' } }
    ] },
  { id: 'petition', name: 'The village petitions', weight: 2, window: [1895, 1960], cond: 'village:150', once: true,
    text: 'A petition with sixty names: a small light on the harbour wall, so the boats can find the entrance on a black night.',
    choices: [
      { label: 'Fund it from the station', eff: { funds: -200, village: 20, standing: 4, flag: 'harbour_light', log: 'Paid for a harbour light out of the station purse. The Board will call it irregular. The fleet calls it the Little Light.' } },
      { label: 'Refer them to the Board', eff: { standing: 1, village: -5, log: 'Referred the harbour-light petition to the Board. The Board has acknowledged it. The Board acknowledges things. The harbour has noticed.' } }
    ] },
  { id: 'audit', name: 'The stores audit', weight: 2, window: [1890, 1975],
    text: 'A clerk with a ledger wants the stores counted against the log, cask by cask.',
    choices: [
      { label: 'Count with him', eff: { chance: { p: 0, cond: 'fuelHigh', then: { standing: 5, log: 'Stores audit. Every cask where the log said it was. The clerk seemed disappointed and said so to the Board.' }, else: { standing: -5, log: 'Stores audit. The store was lower than the log. The clerk wrote "unexplained" and I had no explanation he would have accepted.' } } } }
    ] },
  { id: 'fever', name: 'The child has a fever', weight: 2, window: [1890, 1950], once: true,
    text: 'Scarlet fever, by the look of it. The doctor is across the bay at Harrow and the bay is white.',
    choices: [
      { label: 'Row for the doctor', eff: { chance: { p: 0.7, then: { standing: 5, keepersRaised: 1, log: 'Rowed to Harrow for the doctor in a sea I would not have crossed for money. The child lived. She is going to be a keeper; she told the doctor so.' }, else: { funds: -50, standing: 2, log: 'Rowed for the doctor and lost the boat on the Harrow bar. Walked him back along the cliff. The child lived. The boat did not.' } } } },
      { label: 'Wait for the tide', eff: { standing: -1, log: 'Waited for the tide to fetch the doctor. The longest four hours in the log. The fever broke before he came.' } }
    ] },
  { id: 'tender_trouble', name: 'The tender in trouble', weight: 2, window: [1890, 1965],
    text: 'The Board\'s own tender, engine stopped, drifting down on the bank in a rising sea.',
    choices: [
      { label: 'Launch the station boat', eff: { funds: -20, shipsSaved: 1, standing: 8, log: 'Launched for the tender with her engine dead. Got a line aboard on the third throw. The Board wrote to thank me, which it does not do.' } },
      { label: 'Keep the light and pray', eff: { chance: { p: 0.3, then: { standing: -6, log: 'The Board\'s tender struck the bank in the dark. Her crew came ashore in our boat after all, at first light, and the Board\'s report asks why not sooner.' }, else: { standing: 1, log: 'The tender got her engine going a cable off the bank. I kept the light and did nothing else, which was correct, and which I will think about for a long time.' } } } }
    ] },
  { id: 'birdfall', name: 'The birds', weight: 2, window: [1890, 1990], tags: ['fog'],
    text: 'Thousands of migrating birds strike the lantern in the fog. The gallery is feathered to the rail.',
    choices: [
      { label: 'Keep full light', eff: { standing: 1, mod: { key: 'range', mult: 0.85, days: 4 }, log: 'A bird-fall in the night. Swept the gallery at dawn: starlings, redwings, a woodcock. Kept full light. The ships come first. The glass took four days to come clean.' } },
      { label: 'Shade half the lantern until dawn', eff: { funds: -10, village: 3, log: 'Shaded the landward half of the lantern through the bird-fall. Half of them lived. A naturalist from the village came to count the rest and has not stopped coming.' } }
    ] },
  { id: 'cottage_fire', name: 'Fire in the cottage', weight: 1, window: [1890, 1975],
    text: 'A chimney fire takes the roof of the cottage while the watch is in the lantern.',
    choices: [
      { label: 'Rebuild from the station purse', eff: { funds: -100, log: 'Chimney fire. Lost the cottage roof. Rebuilt it from the station purse, slate this time.' } },
      { label: 'Let the village rebuild it', eff: { village: 10, standing: -1, log: 'Chimney fire. The village rebuilt the cottage roof in a week, with a thatch the Board will not approve of and I will not replace.' } }
    ] },
  { id: 'ghost', name: 'A second light', weight: 1, window: [1890, 1930],
    text: 'The assistant swears there was a second light on the bank at two in the morning, where no light should be.',
    choices: [
      { label: 'Go down and look', eff: { fuel: -4, chance: { p: 0.5, then: { standing: 8, log: 'Went down to the bank at night after a false light. Found a lantern on a pole and two men who ran. Wreckers, in this century. Told the magistrate.' }, else: { log: 'Went down to the bank after a false light. Found nothing but the tide. The assistant is sure. I have logged it as weather.' } } } },
      { label: 'Log it and sleep', eff: { log: 'Assistant reports a second light on the bank. Logged. Slept. Some things in this book are for the next keeper to understand.' } }
    ] },
  { id: 'lens_offer', name: 'An offer from the Board', weight: 2, window: [1890, 1905], once: true, cond: '!has:fresnel4',
    text: 'A fourth-order lens, second-hand from a decommissioned light, at a third of the price, if the station pays carriage.',
    choices: [
      { label: 'Pay the carriage', eff: { funds: -60, grant: 'fresnel4', log: 'The Board offered a second-hand lens for the carriage. Paid it. The prisms came in straw and were perfect. Somebody kept that light well.' } },
      { label: 'Wait for a new one', eff: { log: 'Declined a second-hand lens. The Board writes that a new one is coming from Birmingham. The Board has written that before.' } }
    ] },
  // ---- war ----
  { id: 'admiralty', name: 'Admiralty orders', weight: 6, window: [1914, 1918], once: true, tags: ['war'], at: { y: 1914, d: 230 },
    text: 'The light is to be shown only on signal from the Admiralty. On every other night it is to be dark.',
    choices: [
      { label: 'Obey', eff: { dark: 20, standing: 10, log: 'Admiralty orders: dark unless signalled. Obeyed. Twenty nights with the lamp cold and the sea full of engines. A dark lighthouse is a contradiction I have no stomach for.' } },
      { label: 'Show the light when ships are near', eff: { shipsSaved: 30, standing: -12, flag: 'disobeyed', log: 'A minesweeper went up off the bank at dawn. We showed the light against orders after that. Fourteen came ashore alive. Let them court-martial a lighthouse.' } }
    ] },
  { id: 'admiralty2', name: 'The light under Admiralty control', weight: 6, window: [1939, 1945], once: true, tags: ['war'], at: { y: 1939, d: 260 },
    text: 'Blackout. The light burns under Admiralty control: four minutes, on signal, for the convoys.',
    choices: [
      { label: 'Keep the four-minute discipline', eff: { dark: 15, standing: 12, log: 'Convoy night. Forty ships in the dark and our beam on for exactly four minutes by order. In those four minutes I believe I aged a year.' } },
      { label: 'Stretch the minutes when it is bad', eff: { shipsSaved: 25, standing: -6, dark: 8, log: 'Stretched four minutes to eleven for a convoy straggler with her steering gone. Nobody signalled. Nobody wrote it down but me.' } }
    ] },
  { id: 'mine', name: 'A mine in the bay', weight: 4, window: [1914, 1946], tags: ['war'],
    text: 'A horned mine, drifting in on the flood, two cables from the fishing fleet.',
    choices: [
      { label: 'Row out and tie a flag to it', eff: { chance: { p: 0.6, then: { standing: 10, village: 5, log: 'Rowed out to a drifting mine and tied a flag to it so the Navy could find it. My hands did not shake until I was ashore.' }, else: { funds: -100, standing: 4, log: 'Went for the mine in the boat. It went up on the rocks before I reached it and took the landing stage with it. The fleet was in. That is the point.' } } } },
      { label: 'Telegraph the Navy and keep the fleet in', eff: { standing: 3, village: -3, log: 'Mine in the bay. Telegraphed the Navy and hoisted the flags to keep the fleet in. A trawler came and shot at it until it sank. Dull, and correct. The fleet lost two days\' fishing and blamed the light.' } }
    ] },
  { id: 'ration', name: 'Fuel on the ration', weight: 4, window: [1916, 1946], tags: ['war'], once: true,
    text: 'The Ministry has rationed the station\'s fuel. Half the allowance, for the duration.',
    choices: [
      { label: 'Accept and manage', eff: { fuel: -30, mod: { key: 'supply', mult: 0.5, days: 365 }, standing: 4, log: 'Fuel rationed. Accepted it. Managed. A year of thin light and careful sums.' } },
      { label: 'Appeal to the Board', eff: { standing: -5, log: 'Appealed the fuel ration and won. The Board thinks me difficult. The lamp thinks me right.' } }
    ] },
  { id: 'bomber', name: 'A bomber in the bay', weight: 3, window: [1940, 1945], once: true, tags: ['war'],
    text: 'An aircraft down in the bay at dusk. A man in the water. The markings are not ours.',
    choices: [
      { label: 'Row', eff: { standing: 6, village: -4, fuel: -5, log: 'A bomber came down in the bay. We rowed. The pilot was nineteen and German and very cold, and we brought him in and gave him tea, because that is what the lifeboat does. Half the village will not speak to us. The other half brought jam.' } },
      { label: 'Call the coastguard and keep the light', eff: { chance: { p: 0.25, then: { standing: -4, log: 'Aircraft down in the bay. Called it in and kept the light. The coastguard launch was there in twenty minutes. Twenty minutes was too long. He was nineteen.' }, else: { standing: 2, log: 'Aircraft down in the bay. Called it in and kept the light. The coastguard launch was there in twenty minutes. He was alive. He is a prisoner. He was nineteen.' } } } }
    ] },
  { id: 'strike', name: 'No deliveries', weight: 3, window: [1926, 1926], once: true, at: { y: 1926, d: 123 },
    text: 'The General Strike. No coal, no paraffin, no lorry, no tender. The store has what it has.',
    choices: [
      { label: 'Buy from the fishermen', eff: { funds: -60, fuel: 60, village: 3, log: 'General Strike. No deliveries. The fishermen sold the station their own engine paraffin at cost and said nothing about politics.' } },
      { label: 'Eke it out', eff: { mod: { key: 'range', mult: 0.7, days: 30 }, log: 'General Strike. Eked out the store for a month at half flame. Nobody struck. Nobody noticed, which is the compliment a lighthouse gets.' } }
    ] },
  { id: 'royal', name: 'A royal visit', weight: 2, window: [1920, 1980], once: true,
    text: 'A letter on thick paper: a member of the Royal Family wishes to see the light. The Board is beside itself.',
    choices: [
      { label: 'Polish everything', eff: { funds: -50, standing: 12, village: 8, log: 'Royal visit. A Duke climbed the stair, said "Splendid", and asked a good question about the mercury float. Gave him the answer. The Board gave me a medal, eventually.' } },
      { label: 'Keep it a working day', eff: { standing: 4, village: -4, log: 'Royal visit. Kept the station a working station: lamp trimmed at the usual hour, log written at the usual time. He noticed. He said he preferred it. The village had the bunting out and has not forgiven me it.' } }
    ] },
  { id: 'winter47', name: 'The winter', weight: 8, window: [1947, 1947], once: true, tags: ['storm'], at: { y: 1947, d: 45 },
    text: 'Snow to the sills and ice on the inside of the glass. The lorry has not come in three weeks and the sea is grey slush.',
    choices: [
      { label: 'Burn double and keep the lamp warm', eff: { fuel: -40, standing: 6, log: 'The winter they will talk about. Ice on the inside of the glass. We kept the light. I will write it only once: we kept the light.' } },
      { label: 'Reduce the light and save the fuel', eff: { mod: { key: 'range', mult: 0.7, days: 40 }, log: 'The winter. Reduced the lamp to make the fuel last until the thaw. Nobody was at sea who could help it. We kept a light, which is less than the light.' } }
    ] },
  { id: 'surge', name: 'The surge', weight: 8, window: [1953, 1953], once: true, tags: ['storm'], at: { y: 1953, d: 32 },
    text: 'A north wind, a spring tide, and the sea over the harbour wall and into the street.',
    choices: [
      { label: 'Open the station to the village', eff: { funds: -200, village: 30, standing: 15, log: 'The great flood. Opened the station to the village: sixty people in the tower and the lifeboat out four times and back four times, which is the only arithmetic that matters.' } },
      { label: 'Secure the light first', eff: { standing: 3, village: -15, log: 'The flood. Secured the light first, as the rules say. The lifeboat did the rest. The village has not forgotten which door was shut.' } }
    ] },
  { id: 'pirate', name: 'A pirate radio ship', weight: 2, window: [1964, 1972], once: true,
    text: 'A rusty freighter anchored off the point, playing records at the whole coast, wants to buy diesel, cash, no paperwork.',
    choices: [
      { label: 'Sell them the diesel', eff: { funds: 300, standing: -4, log: 'Sold diesel to the pirate radio ship. They dedicated a record to "the lighthouse". It was not a good record.' } },
      { label: 'Refuse', eff: { standing: 2, mod: { key: 'speed', mult: 0.9, days: 30 }, log: 'Refused the pirate radio ship its diesel. They play the station a record every night anyway, to annoy me. It works.' } },
      { label: 'Report them', eff: { standing: 5, village: -6, log: 'Reported the pirate radio ship. The village, which liked the records, has views. The Post Office sent a letter of thanks that I did not frame.' } }
    ] },
  { id: 'film', name: 'A film crew', weight: 2, window: [1950, 1989],
    text: 'A film company wants the tower for a week: cables on the stair, a lamp of their own, and a cheque.',
    choices: [
      { label: 'Take the cheque', eff: { funds: 500, standing: -3, mod: { key: 'range', mult: 0.8, days: 7 }, log: 'A film crew for a week. They lit the tower with their own lamps and asked me to look "weathered". I did not have to act. Their cables kept the lantern door open all week. The Board\'s letter about it was longer than the cheque.' } },
      { label: 'A working light is not a set', eff: { standing: 2, village: -3, log: 'Turned away a film crew. They filmed from the harbour. The film was about a murder. Not here. The village had hoped for the extras\' wages.' } }
    ] },
  { id: 'survey', name: 'The automation survey', weight: 4, window: [1962, 1985], once: true,
    text: 'Two engineers with a theodolite and a folder marked AUTOMATION FEASIBILITY. They are polite. They are thorough.',
    choices: [
      { label: 'Help them', eff: { standing: 4, flag: 'helped_survey', auto: 2, village: -6, log: 'Helped the automation survey. Showed them everything. They wrote it all down. One of them said, "You make it look simple." That is the job. Word got round the harbour by teatime.' } },
      { label: 'Lose the paperwork', eff: { standing: -3, village: 6, legend: 1, log: 'The automation survey\'s folder went into the sea off the gallery in a gust. There was no gust. I have logged a gust.' } }
    ] },
  { id: 'spill', name: 'Oil on the beach', weight: 3, window: [1967, 1990], once: true, at: { y: 1974, d: 302 },
    text: 'A tanker has lost a tank off Shale Point and the slick is on your beach by morning: black weed, black birds.',
    choices: [
      { label: 'Organise the clean-up', eff: { funds: -400, village: 30, standing: 10, legend: 1, log: 'Oil on the beach. Organised the clean-up from the station: two hundred people in borrowed boots. The birds we could save, we saved. The beach took a year.' } },
      { label: 'Leave it to the council', eff: { village: -10, log: 'Oil on the beach. Left it to the council. The council sent a man with a clipboard, and then, a month later, a lorry.' } }
    ] },
  { id: 'heritage_petition', name: 'Keep the light manned', weight: 4, window: [1979, 1989], once: true,
    text: 'A petition from the village, four hundred names: the light must stay manned. They want the Principal Keeper\'s signature at the top.',
    choices: [
      { label: 'Sign it', eff: { village: 20, legend: 3, standing: -2, log: 'Signed the village petition to keep the light manned, at the top, in the same hand as the log. The Board will not like it. The Board is not here at three in the morning.' } },
      { label: 'A keeper is neutral', eff: { standing: 3, auto: 1, village: -8, log: 'Did not sign the petition. A keeper serves the Board and the ships, in that order on paper and the other order in fact. The village understood. Mostly.' } }
    ] },
  { id: 'sailing_school', name: 'A sailing school', weight: 2, window: [1960, 1990], once: true,
    text: 'The marina people want to run a sailing school for town children, with the lighthouse as its badge.',
    choices: [
      { label: 'Lend the name and the gallery', eff: { village: 15, funds: 100, standing: -3, log: 'A sailing school with the lighthouse on its badge. Forty children a summer learning which way the flash goes. Good. The Board wrote to ask whose idea the gallery was.' } },
      { label: 'Decline', eff: { log: 'Declined the sailing school the use of the station. They used the harbour wall instead and put the lighthouse on the badge anyway.' } }
    ] },
  { id: 'drunk_assistant', name: 'The relief keeper', weight: 2, window: [1920, 1985], cond: 'keepers2',
    text: 'The relief keeper came off the boat drunk and is asleep on the stair. The middle watch is his.',
    choices: [
      { label: 'Stand his watch and say nothing', eff: { chance: { p: 0.3, then: { standing: -5, log: 'Stood the relief\'s watch and said nothing. The Board heard anyway, from the boatman, and wants to know why it was not reported.' }, else: { standing: 2, log: 'Stood the relief\'s watch. Said nothing. He stood my next two without being asked. That is how it works, or it does not work.' } } } },
      { label: 'Report him', eff: { standing: 3, mod: { key: 'speed', mult: 0.85, days: 60 }, log: 'Reported the relief keeper. The Board removed him and sent nobody for two months. Right, and expensive.' } }
    ] },
  { id: 'wreck_boat', name: 'An empty boat', weight: 1, window: [1900, 1960],
    text: 'A ship\'s boat on the beach at dawn, oars shipped, no one in it, a name on the transom you do not know.',
    choices: [
      { label: 'Search the shore', eff: { fuel: -3, standing: 3, log: 'Found an empty ship\'s boat. Searched the shore to Shale Point and back. Nothing. Reported the name. No ship of that name is missing. It is in the yard. I do not like to look at it.' } },
      { label: 'Report it and leave it', eff: { log: 'Empty boat on the beach. Reported it. The Receiver has it. Nobody has claimed it. Nobody will.' } }
    ] },
  { id: 'telegram_pay', name: 'Extra duties', weight: 2, window: [1895, 1970], once: true,
    text: 'The Board offers a stipend if the station takes on the Shale Point buoy: a row out in all weathers, monthly.',
    choices: [
      { label: 'Accept', eff: { standing: 2, flag: 'buoy_duty', salaryAdd: 1, funds: -40, log: 'Took on the Shale Point buoy for a stipend. A wet row once a month for a dry sum. The buoy is called Bertha. Nobody knows why. Bought a boat fit for her out of the first quarter.' } },
      { label: 'The light is work enough', eff: { log: 'Declined the Shale Point buoy. The light is work enough. The Board gave it to Harrow, who gave it to a boy, who is doing well.' } }
    ] },
  { id: 'letter1979', name: 'The letter with a date in it', weight: 0, window: [1979, 1979], once: true, at: { y: 1979, d: 12 },
    text: 'The Board\'s letter is two pages. The second page has a date on it: 1990. Automation. The Principal Keeper is invited to "assist with the transition" or to "make representations".',
    choices: [
      { label: 'Make representations: fight for a manned light', eff: { flag: 'fight', standing: -5, log: 'Replied to the Board\'s automation letter. Four pages. The word "no" appears nine times. The village is collecting signatures. Eleven years to make a legend of this rock, or to lose.' } },
      { label: 'Assist with the transition', eff: { flag: 'prepare', standing: 10, auto: 2, log: 'Replied to the Board\'s automation letter: the station will assist. The engineers can have the logbook. It is the best manual anyone will ever write for this light.' } }
    ] },
  { id: 'storm_skerra', name: 'Ice storm', weight: 3, window: [1890, 1990], tags: ['storm'], headland: 'skerra',
    text: 'Freezing spray. The gallery rail is a foot thick with ice and the lantern glass is going white.',
    choices: [
      { label: 'Go out and chip the glass', eff: { fuel: -8, standing: 5, chance: { p: 0.2, then: { funds: -60, log: 'Chipped ice off the lantern glass in a gale, roped to the rail. Lost the rope and nearly the keeper. Kept the light.' }, else: { log: 'Chipped ice off the lantern glass by the hour, roped to the rail. The beam stayed clear. My hands came back by morning.' } } } },
      { label: 'Let it ice and burn through it', eff: { mod: { key: 'range', mult: 0.6, days: 5 }, log: 'Let the lantern ice and burned through it. A fog of light, five nights. Nobody was at sea who could help it.' } }
    ] },
  { id: 'squall_api', name: 'The sumatra', weight: 3, window: [1890, 1990], tags: ['fog'], headland: 'api',
    text: 'A line squall off the strait: black, flat, and on you in ten minutes. Eleven ships inside the reef.',
    choices: [
      { label: 'Fire the cannon and show every lamp', eff: { fuel: -10, standing: 6, shipsSaved: 4, log: 'Sumatra squall. Fired the signal cannon and lit every lamp in the tower. Eleven ships rode it out inside the reef. None struck.' } },
      { label: 'Secure the station', eff: { standing: 1, chance: { p: 0.4, then: { standing: -5, log: 'Secured the station for the squall. A junk struck the reef. All saved by the fishermen, not by me.' }, else: { log: 'Secured the station for the squall. It passed to the north. Luck is not a method.' } } } }
    ] },
  { id: 'patrol_fer', name: 'A patrol boat', weight: 4, window: [1890, 1990], tags: ['war'], headland: 'fer',
    text: 'A patrol boat with no flag asks, over a loud-hailer, which side the light is on tonight.',
    choices: [
      { label: '"The ships\' side."', eff: { chance: { p: 0.3, then: { standing: 6, dark: 1, funds: -40, log: 'A patrol boat asked which side the light was on. Told them: the ships\'. They put two rounds through the lantern glass on the way out. One night dark while the glass came.' }, else: { standing: 6, log: 'A patrol boat asked which side the light was on. Told them: the ships\'. They went away. They always go away. So far.' } } } },
      { label: 'Say nothing and keep the beam turning', eff: { standing: 2, dark: 1, log: 'A patrol boat asked whose light this was. Said nothing. Put the light out for an hour to make the point and hated every minute of it.' } }
    ] }
];

/* The logbook. Story entries fire on reaching a year (and optional day). headland limits an entry to one headland. */
const LOGBOOK = [
  { y: 1890, d: 0, t: 'Took charge of {headland} light this day. Argand lamp, four wicks, oil in the store for eleven nights. The Board\'s man left on the morning tide and did not look back. — E. Rook, Principal Keeper' },
  { y: 1890, d: 40, t: 'Carried oil up a hundred and twelve steps nine times today. Counted them each time. They are a hundred and twelve each time.' },
  { y: 1890, d: 200, t: 'A collier passed so close in the night I could read her name by my own light. She gave three on the whistle. That is the first thanks the tower has had.' },
  { y: 1891, d: 60, t: 'Ada has planted the garden against all advice. Salt will have it by August. She says August can try.' },
  { y: 1892, d: 10, t: 'Herring fleet in. Forty boats in the lee of the rock at dusk, lanterns like a street. The light is a street-lamp to them. Good.' },
  { y: 1893, d: 100, t: 'A daughter, born in the lamp room because the stairs were quicker than the bed. We have called her Nell. She slept through the whole of a southwesterly.' },
  { y: 1895, d: 30, t: 'Inspector Hallam came unannounced and ran a white glove along the lantern brass. He found nothing, and seemed sorry.' },
  { y: 1897, d: 150, t: 'Nell can count the ships now. She counts them twice: once out, once home. If the numbers differ she will not go to bed.' },
  { y: 1899, d: 300, t: 'The century is turning and the oil is thin. The Board writes that a lens is coming from Birmingham. The Board has written that before.' },
  { y: 1901, d: 22, t: 'The old Queen is dead. We flew the ensign at half mast and the fishing boats did the same, which I had not expected of them.' },
  { y: 1904, d: 120, t: 'A village is forming at the landing. Six houses where there were two. They say it is because of the light. I say it is because of the herring, but I wrote it down anyway.' },
  { y: 1907, d: 80, t: 'Nell took the middle watch alone tonight. I lay awake and listened to the clockwork, and found I could not hear it. She had wound it properly.' },
  { y: 1910, d: 200, t: 'Ada\'s heart. The doctor came by the landing stage, the first time that stage has been worth its cost. She is to rest. She has agreed to rest in the lantern, where she can see.' },
  { y: 1912, d: 105, t: 'News of the Titanic by telegraph. Nell read it twice and then went up and polished every prism as if that would help. Perhaps it does.' },
  { y: 1914, d: 215, t: 'War. The Board orders the light shown only on request of the Admiralty. I have read the letter three times and it says the same thing each time.' },
  { y: 1916, d: 50, t: 'Ada died in the lantern in her chair, in daylight, with the lens turning. Nell has taken the garden. The salt still has not had it.' },
  { y: 1917, d: 140, t: 'Paraffin at last. The Board calls it "petroleum vapour". Brighter and meaner. It hisses like it knows something.' },
  { y: 1918, d: 315, t: 'The guns have stopped. Nell says the silence on the wireless is the loudest thing she ever heard.' },
  { y: 1920, d: 70, t: 'Elias Rook died in his bed at 0340 with the light burning. I have taken the log. I have taken the watch. — N. Rook, Principal Keeper (acting)' },
  { y: 1921, d: 20, t: 'The Board confirmed me Principal. The letter says "in consideration of exceptional circumstances", meaning they could find no man who wanted the rock. I want it.' },
  { y: 1924, d: 160, t: 'A son. Tom. Born in the cottage like a civilised person, says his father, who is a fisherman and will be ignored on the subject of lighthouses.' },
  { y: 1926, d: 240, t: 'The engineers have gone. Three weeks of noise and swearing. There is a hum under the tower now that I feel in my teeth, and the lamp room smells of nothing.' },
  { y: 1928, d: 90, t: 'The pilots say the new signal can be heard at Shale Point. Every dog in the village howled for a mile. Good.' },
  { y: 1930, d: 0, t: 'Electrification. The Board\'s word, on a certificate. I miss the oil, and would not go back to it for all the brass in Birmingham.' },
  { y: 1931, d: 330, t: 'Hard year on the land. We fed eleven families from the station stores and did not tell the Board until spring.' },
  { y: 1934, d: 60, t: 'Tom took the first watch alone at ten years old. Illegal and necessary. He wound the float and did not spill a drop.' },
  { y: 1936, d: 20, t: 'The King\'s voice in a lighthouse, from a box in the kitchen. Father would have switched it off.' },
  { y: 1938, d: 270, t: 'The Board sends a man to measure the lantern for "blackout fittings". He does not say for what. We all know for what.' },
  { y: 1939, d: 245, t: 'War again. The light burns under Admiralty control. Tom has been told he is too young and has not listened.' },
  { y: 1941, d: 100, t: 'Tom gone to the minesweepers. The log has one hand in it again. I write larger, to fill it.' },
  { y: 1944, d: 157, t: 'The sea full of ships going south, all night, no lights. We showed nothing. Everyone on the gallery, saying nothing, watching the dark go by.' },
  { y: 1945, d: 128, t: 'VE Day. Tom back from the minesweepers, thinner and quiet. He went straight up to the lantern and stood there until dark.' },
  { y: 1947, d: 40, t: 'Snow to the sills. The lorry has not come in three weeks. I have the log open in front of me and nothing to write but the temperature.' },
  { y: 1950, d: 100, t: 'N. Rook retired to the village on a Board pension and the loan of a telescope. — T. Rook, Principal Keeper, taking up the log.' },
  { y: 1953, d: 31, t: 'North wind and a spring tide together. Harbour wall under water at eleven. I have never seen the sea in the street.' },
  { y: 1956, d: 200, t: 'A cable from the shore. The engineers call the light "the installation". I call it the light.' },
  { y: 1958, d: 90, t: 'A daughter, Jo. Born in the lamp room like her great-grandmother\'s granddaughter, because the stairs were quicker, because they always are.' },
  { y: 1962, d: 150, t: 'The Board\'s letter uses the word "automation" for the first time. I have filed it under "weather".' },
  { y: 1965, d: 220, t: 'A visitor from the Ministry stood in the lantern and asked what, exactly, a keeper does all day. I showed him the logbook. He stopped asking.' },
  { y: 1968, d: 170, t: 'Jo has painted the gallery railings a colour the Board has not approved. The Board has not been to look. The ships approve.' },
  { y: 1971, d: 60, t: 'Relief from the sky today. Jo waved it in with the flags her grandmother sewed.' },
  { y: 1974, d: 300, t: 'Tanker aground at Shale Point, not ours, but we saw her lights go wrong and rang the coastguard eleven minutes before anyone else. Eleven minutes is a lifeboat launched.' },
  { y: 1976, d: 190, t: 'Mother, N. Rook, died in the village, with the telescope on the sill pointed at the tower. Her log is in the cupboard. Mine is on the desk. They are the same log.' },
  { y: 1979, d: 10, t: 'The word "automation" again, this time with a date. 1990. I have eleven years to make the Board change its mind, or to make them regret not changing it.' },
  { y: 1982, d: 100, t: 'T. Rook retired. — J. Rook, Principal Keeper. The log is nearly a century old. I am keeping it in the same hand.' },
  { y: 1984, d: 200, t: 'It does not rotate; it does not need me to. I rotate anyway. Somebody has to walk the gallery.' },
  { y: 1986, d: 140, t: 'Four generations of Rook in this book. The Board\'s historian came and counted. She cried at 1920, which was the correct place.' },
  { y: 1988, d: 250, t: 'The last supply boat. The last relief by sea. I kept the mooring rope. I do not know what for.' },
  { y: 1946, d: 300, t: 'Tom is sleeping again, most nights. On the others he climbs the stair and sits with the lens until it is light. I do not ask. He does not log it.' },
  { y: 1948, d: 150, t: 'The first holiday-makers off the Harrow bus, asking to see the light. I showed them the stair. Two went up. One came down and asked for tea.' },
  { y: 1949, d: 330, t: 'Tom married Mary Fell from the post office, in the chapel the herring built. The light was lit for the wedding at three in the afternoon, against regulations. The Board was not invited.' },
  { y: 1951, d: 60, t: 'First winter as Principal. Mother comes out on the Tuesday boat to inspect. She ran a finger along the lens frame and said nothing, which is a pass. — T. Rook' },
  { y: 1952, d: 210, t: 'The fishing fleet half what it was. The herring have gone wherever herring go. The village has not. It has a school now, and the school has a view.' },
  { y: 1954, d: 18, t: 'Wireless from a Norwegian coaster: "Light Carrow seen, thank you." Nobody thanks a light. I have pinned it above the desk.' },
  { y: 1955, d: 280, t: 'The Board sends a form asking how many hours a day the keeper is "actively engaged". I wrote twenty-four. They sent it back.' },
  { y: 1957, d: 120, t: 'Mary has the garden now. Cabbages where Mother grew roses where Ada grew nothing at all. The salt takes a third, as it always has.' },
  { y: 1959, d: 340, t: 'Jo\'s first Christmas. We carried her up to see the beam go round. She laughed every time it came back, as if it might not.' },
  { y: 1961, d: 75, t: 'A survey ship sounding the bay for a week. Her officer says our chart is out by forty yards. The rock has not moved in seventy years. I told him to check his ship.' },
  { y: 1963, d: 30, t: 'The big freeze. Ice on the inside of the lantern glass. Mary and I scraped it every two hours with Mother\'s old butter knives.' },
  { y: 1964, d: 250, t: 'Jo asked why the light has to go round. So ships know it is ours, I said. Then why not write the name on it, she said. I had no answer for her.' },
  { y: 1966, d: 210, t: 'The football on the wireless, the whole village in the boathouse to hear it. We won. Jo ran up the hundred and twelve steps to tell the light.' },
  { y: 1967, d: 80, t: 'Oil on the water off Cornwall, from a tanker on the Sevenstones, they say. Hundreds of miles away. I walked our tideline every morning for a month anyway.' },
  { y: 1969, d: 200, t: 'Men on the moon, on the television in the Harrow Arms. Jo says they will be able to see our light from up there. I said they will be busy. She is writing to them.' },
  { y: 1970, d: 290, t: 'Jo has started a log of her own, in pencil, in the back of mine. Wind, sea state, and which of the gulls are her friends.' },
  { y: 1972, d: 45, t: 'Power cuts on the mainland three nights a week. The village by candlelight and the light on its own generator, the brightest thing for thirty miles. People walked out to the landing just to look at something lit.' },
  { y: 1973, d: 330, t: 'The Board\'s auditor wanted receipts back to 1890. I gave him the logbook. He has been at the kitchen table for two days.' },
  { y: 1975, d: 250, t: 'Jo has gone to the college at Aberdeen. She took the pencil log. The back of mine is empty from here.' },
  { y: 1977, d: 157, t: 'The Jubilee. Bunting from the gallery to the boathouse. Mother would have said it spoiled the daymark. She would have hung it herself.' },
  { y: 1978, d: 300, t: 'Jo home from Aberdeen with a ticket in marine engineering and opinions about the generator. Most of them are right.' },
  { y: 1980, d: 60, t: 'The Board sent a man to photograph every room "for the record". He asked me to stand out of the frame. I stood out of the frame.' },
  { y: 1981, d: 220, t: 'Jo has rewired the lamp room to a standard the Board has never seen and never will. It is better. I have logged it as maintenance.' },
  { y: 1983, d: 40, t: 'First winter in charge. Dad rings from the village every night at ten to ask if the light is lit. I hold the receiver up to the window. — J. Rook' },
  { y: 1985, d: 310, t: 'A school party from Harrow. A boy asked if I was the last lighthouse keeper. I said not yet. He wrote it down.' },
  { y: 1987, d: 288, t: 'The great storm in the south, on the news. Here it was only a gale. We had the light, the wireless and the kettle, and listened to the rest of the country lose its trees.' },
  { y: 1988, d: 40, t: 'Dad died in the village. The telescope went to the school. In his drawer, his last log line: "Light lit. All well." That was all of them, really.' },
  { y: 1989, d: 300, t: 'A storm like 1890\'s, by the old log. We kept the light. The computer kept it, and I watched the computer, which is a kind of keeping.' },
  // headland variants
  { y: 1890, d: 0, headland: 'skerra', t: 'Took charge of Skerra Head this day, with an heirloom from Carrow in the boat and ice on the landing in May. The Board\'s man did not get out of the launch. — A. Rook, Principal Keeper' },
  { y: 1890, d: 0, headland: 'api', t: 'Took charge of Pulau Api this day: a white tower on a reef, a strait that never empties, and heat like a lamp room in August. — A. Rook, Principal Keeper' },
  { y: 1890, d: 0, headland: 'fer', t: 'Took charge of Cap Fer this day, from a keeper who would not say which flag he had kept it under. There are two in the cupboard. — A. Rook, Principal Keeper' },
  { y: 1895, d: 180, headland: 'skerra', t: 'Ice on the inside of the glass in April. Chipped it with a spoon. The beam goes out white through the frost, like a lamp in milk.' },
  { y: 1895, d: 180, headland: 'api', t: 'Haze for a month. The lamp makes a ball of light the size of the tower and no further. Fired the cannon at the hour. The junks answer with gongs.' },
  { y: 1895, d: 180, headland: 'fer', t: 'A gunboat anchored off the point for a week and said nothing. We showed the light. It left. The log notes the weather, which was fine.' },
  { y: 1960, d: 100, headland: 'skerra', t: 'A helicopter tried the landing and went away. The ice on the pad is older than the pilot.' },
  { y: 1960, d: 100, headland: 'api', t: 'Three hundred ships a week in the strait now. The light is a kerb-stone on a motorway. They still look for it.' },
  { y: 1960, d: 100, headland: 'fer', t: 'The frontier moved again, on paper. The tower did not. The ships did not. The dues are paid in whichever coin the ship carries.' }
];

/* Milestone logs keyed by engine events. */
const MILESTONES = {
  firstDark: 'Dark tonight. No oil. I stood on the gallery and listened for engines and prayed for no one to need me.',
  firstWreck: 'The {ship} struck the bank in the dark. We could not have shown a light we had no oil for. We could have had oil. I have written that down so I cannot unwrite it.',
  firstRescue: 'The {ship} struck the bank in the dark and the lifeboat went out and brought every soul ashore. A wreck is not the end of the story any more.',
  era2: 'The Board\'s circular calls it "the modern era". The lamp calls it Tuesday. Paraffin, wireless, and a war that has not finished starting.',
  era3: 'Peace, and a cable from the shore promised for the decade. The village is three streets. The lamp room smells of nothing.',
  gate: 'Forty years, one family, one light. The free part of the century ends here, with the first bulb. The rest of the century is war, flood, helicopters, the letter with "automation" in it, and the ending. The light keeps earning while it waits.',
  electrified: 'Electrified. One switch, one bulb, one keeper not carrying oil up a hundred and twelve steps. The step count has not changed. I checked.',
  village100: 'A hundred souls at the landing, by the parish count. There was a rock and a light. Now there is a place.',
  village500: 'Five hundred in the village. A post office, a chapel, two pubs. All of it in the lee of the light.',
  village2000: 'Two thousand people. The council calls it a town. The ships call it the light at Carrow, because that is what it is for.',
  ships1000: 'A thousand ships past the bank in safety, by the log. Nobody counts the ones that did not wreck. I do.',
  ships10000: 'Ten thousand ships. If every master who passed in the night had waved, the gallery would never have been empty.',
  ships50000: 'Fifty thousand ships guided, by the station log, since 1890. That number is the whole point. The rest of this book is how.'
};

const SHIP_NAMES = ['Mary Blyth', 'Corsair', 'Agnes of Harrow', 'Northern Star', 'Jupiter', 'Lady Ellen', 'Tyne Collier', 'Brotherhood', 'Dunlin', 'Saint Hilda', 'Esperance', 'Grace Darling', 'Kestrel', 'Vigilant', 'Margaret Ann', 'Ocean Queen', 'Fram', 'Marguerite', 'Bessie Ivy', 'Hope'];

const ENDINGS = {
  legend: {
    title: 'The Legend of {headland}',
    text: '1990. The Board\'s automation order arrived in January, and in March the Board withdrew it. Four hundred signatures, a heritage listing, a visitors\' centre, a row of cottages full of keepers\' children, and a logbook a century long that somebody had read aloud. {headland} stays manned. It is the only one on the coast. On the first night of the new order, J. Rook climbed the stair at dusk, as always, and wrote in the log: "Light lit. Weather fair. Nothing to report." Which was, and is, the whole of it.',
    log: 'Light lit. Weather fair. Nothing to report. — J. Rook, Principal Keeper, {headland}, 1990. The log continues.'
  },
  overruled: {
    title: 'The Last Keeper',
    text: '1990. The village fought. Four hundred signatures, letters to the newspapers, a Member of Parliament who climbed the stair and said "Splendid". It was not enough: the Board\'s engineers came in April all the same. J. Rook stood on the gallery on the last night and watched the lamp light itself at dusk, exactly on time, as if to prove the point. The village came down to the landing with lanterns, every house, and stood there until the first flash went out over the bank. Then the keeper locked the door from the outside for the first time in a hundred years and walked up the hill to the cottages, where the light still came in at the window, one flash every ten seconds, all night, the way it always had.',
    log: 'Light automated this day, against representations. Keys handed to the Board. Weather fair. The village turned out. — J. Rook, last Principal Keeper, {headland}, 1990. The log ends.'
  },
  automated: {
    title: 'The Light Keeps Itself',
    text: '1990. The engineers came in April with a van and a computer the size of a tea chest. By June the lamp lit itself at dusk, timed itself, changed its own bulbs, and telephoned Harrow if it felt unwell. J. Rook handed the keys to the Board\'s man on the landing where E. Rook had taken them a hundred years before, and did not look back either. The light burns. It will burn long after anyone remembers that it was ever a job. On a clear night you can see it from Shale Point, one flash every ten seconds, {headland}\'s own character, keeping itself.',
    log: 'Light automated this day. Keys handed to the Board. Weather fair. — J. Rook, last Principal Keeper, {headland}, 1990. The log ends.'
  }
};

const DATA = { START_YEAR, END_YEAR, GATE_YEAR, ERAS, HEADLANDS, UPGRADES, EVENTS, LOGBOOK, MILESTONES, SHIP_NAMES, ENDINGS };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.KTL_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
