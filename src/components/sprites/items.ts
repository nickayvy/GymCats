import type { SpriteSheet } from "./types";

// 16x16 single-frame item icons. One character per pixel, "." is transparent.
// The gem-<rarity> colours follow RARITIES / RARITY_STYLES in src/lib/battle/rules.ts.

export type ItemId =
  | "dumbbell"
  | "kettlebell"
  | "sneaker"
  | "water"
  | "fish"
  | "yarn"
  | "paw-heart"
  | "paw-heart-empty"
  | "flame"
  | "star"
  | "crown"
  | "claw"
  | "shield"
  | "spark"
  | "hourglass"
  | "map-pin"
  | "gem-common"
  | "gem-uncommon"
  | "gem-rare"
  | "gem-legendary";

export const ITEM_SPRITES: Record<ItemId, SpriteSheet> = {
  "dumbbell": {
    palette: {
      "O": "#0d0b10", // outline
      "S": "#bcc5d2", // steel
      "s": "#717c8f", // steel shadow
      "H": "#f1f5fa", // steel highlight
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "o": "#ff8a2a", // orange
    },
    frames: [
    // Frame 1
    [
      "................",
      "................",
      "...O........O...",
      "..OoO......OoO..",
      ".OoRrO....OoRrO.",
      ".OoRrO....OoRrO.",
      "OSoRrOOOOOOoRrSO",
      "OSoRrHHHHHHoRrsO",
      "OSoRrssssssoRrsO",
      "OsoRrOOOOOOoRrsO",
      ".OoRrO....OoRrO.",
      ".OoRrO....OoRrO.",
      "..OrO......OrO..",
      "...O........O...",
      "................",
      "................",
    ],
    ],
  },
  "kettlebell": {
    palette: {
      "O": "#0d0b10", // outline
      "S": "#bcc5d2", // steel
      "s": "#717c8f", // steel shadow
      "H": "#f1f5fa", // steel highlight
      "k": "#3f4656", // iron
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO......",
      "....OSSsskO.....",
      "...OSSSsskkO....",
      "..OSSSOOOkkkO...",
      "..OssO...OkkO...",
      "..OssOOOOOkkO...",
      "...OsSSSsskO....",
      "..OSSSSSssskO...",
      "..OSHHSsssskO...",
      ".OSSHSsssskkkO..",
      ".OssssssskkkkO..",
      ".OsssssskkkkkO..",
      ".OkssskkkkkkkO..",
      "..OkkkkkkkkkO...",
      "...OOkkkkkkO....",
      ".....OOOOOO.....",
    ],
    ],
  },
  "sneaker": {
    palette: {
      "O": "#0d0b10", // outline
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "W": "#ffffff", // white
      "w": "#c9d2dc", // white shadow
      "B": "#3fa4f5", // blue
      "b": "#1f5fb8", // blue shadow
      "c": "#a8ecff", // cyan light
    },
    frames: [
    // Frame 1
    [
      "................",
      "................",
      "................",
      "...OOO..........",
      ".OObbbO.........",
      "OrRbbbcO........",
      "ORRBBBWcO.......",
      "ORRBBbBWcOOO....",
      "ORRBBBbBWcccO...",
      "ORRBBBBbBBBBcO..",
      ".OBBBBBBBBBBBcO.",
      ".OOOOOOOOObbbbbO",
      "OWWWWWWWWWWWWWWO",
      ".OwwwwwwwwwwwwwO",
      "..OOOOOOOOOOOOO.",
      "................",
    ],
    ],
  },
  "water": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "B": "#3fa4f5", // blue
      "b": "#1f5fb8", // blue shadow
      "c": "#a8ecff", // cyan light
    },
    frames: [
    // Frame 1
    [
      ".......O........",
      "......ObO.......",
      ".....OBBbO......",
      ".....OBBbO......",
      "....OBBBBbO.....",
      "....OBcBBbO.....",
      "...OBBBBBBbO....",
      "..OBBWBBBBBbO...",
      "..OBBcBBBBBbO...",
      "..OBcBBBBBBbO...",
      "..OBcBBBBBbbO...",
      "..OBBBBBBbbbO...",
      "..OBBBBbbbbbO...",
      "...OBBbbbbbO....",
      "....OObbbOO.....",
      "......OOO.......",
    ],
    ],
  },
  "fish": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "c": "#a8ecff", // cyan light
      "F": "#8cc4e8", // fish
      "f": "#4f86b8", // fish shadow
      "K": "#141018", // eye
    },
    frames: [
    // Frame 1
    [
      "................",
      "................",
      "........O.......",
      ".....OOOfO......",
      "...OOcfffOO..O..",
      "..OccccccccOOfO.",
      ".OFWFfFFFFFFFfO.",
      "OFFKFfFFFFFFffO.",
      "OFFFFfFFFFFFffO.",
      ".OffffffffffFfO.",
      "..OffffffffOOfO.",
      "...OOfffOOO..O..",
      ".....OOO........",
      "................",
      "................",
      "................",
    ],
    ],
  },
  "yarn": {
    palette: {
      "O": "#0d0b10", // outline
      "M": "#e0559a", // yarn
      "m": "#a33070", // yarn shadow
      "n": "#f8a3cb", // yarn highlight
    },
    frames: [
    // Frame 1
    [
      "................",
      "....OOOOOOO.....",
      "...OnnnMMmmO....",
      "..OnnnnmmmMOO...",
      ".OnnnnmmMMmmmO..",
      "OMnnnmmMmmmmmO..",
      "OMnMnMMmmmmmmO..",
      "OMMmnnmmMmmmmO..",
      "OMmmMnmMmmmmmO..",
      "OMmMmnnmmmmmmO..",
      ".OmmmmnmmmmmO...",
      "..OmmmnnmmmOOOO.",
      "...OmmmnnmOmmmmO",
      "....OOmOOO.OmmmO",
      "......O.....OOmO",
      "..............O.",
    ],
    ],
  },
  "paw-heart": {
    palette: {
      "O": "#0d0b10", // outline
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "W": "#ffffff", // white
      "P": "#ffc2d4", // paw pad
    },
    frames: [
    // Frame 1
    [
      "................",
      "...OOOO..OOOO...",
      "..ORRRROORRRRO..",
      ".ORWRRRRRRRRRRO.",
      "ORWWRRRPPRRRRRrO",
      "ORRRPPRPPRPPRRrO",
      "OrRRPPRRRRPPRrrO",
      ".OrRRRRRRRRRrrO.",
      "..OrRRPPPPRrrO..",
      "...OrPPPPPPrO...",
      "....OrPPPPrO....",
      ".....OrRrrO.....",
      "......ORrO......",
      "......OrrO......",
      ".......OO.......",
      "................",
    ],
    ],
  },
  "paw-heart-empty": {
    palette: {
      "O": "#0d0b10", // outline
      "e": "#33212b", // empty heart
      "E": "#7a5262", // empty heart rim and paw
    },
    frames: [
    // Frame 1
    [
      "................",
      "...OOOO..OOOO...",
      "..OEEEEOOEEEEO..",
      ".OEeeeeEEeeeeEO.",
      "OEeeeeeEEeeeeeEO",
      "OEeeEEeEEeEEeeEO",
      "OEeeEEeeeeEEeeEO",
      ".OEeeeeeeeeeeEO.",
      "..OEeeEEEEeeEO..",
      "...OEEEEEEEEO...",
      "....OEEEEEEO....",
      ".....OEeeEO.....",
      "......OEEO......",
      "......OEEO......",
      ".......OO.......",
      "................",
    ],
    ],
  },
  "flame": {
    palette: {
      "O": "#0d0b10", // outline
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "o": "#ff8a2a", // orange
      "Y": "#ffd23f", // gold
      "W": "#ffffff", // white
    },
    frames: [
    // Frame 1
    [
      ".......O........",
      "......OrO.......",
      ".....ORrO.......",
      ".....ORRrO......",
      "..OOORRorO......",
      ".ORrORRoorO.....",
      ".ORRRRoooRrO....",
      ".ORRRRooooRrO...",
      ".ORRRooYooRRrO..",
      ".ORRoooYoooRrO..",
      ".ORRooYYYooRrO..",
      ".ORRoYYWYYoRrO..",
      "..ORoYYWYYorO...",
      "...ORoYYYorO....",
      "....OORRrOO.....",
      "......OOO.......",
    ],
    ],
  },
  "star": {
    palette: {
      "O": "#0d0b10", // outline
      "Y": "#ffd23f", // gold
      "y": "#d1901c", // gold shadow
      "W": "#ffffff", // white
    },
    frames: [
    // Frame 1
    [
      ".......O........",
      "......OYO.......",
      "......OYO.......",
      "......OYO.......",
      ".....OYYYO......",
      ".OOOOOYWYOOOOO..",
      "OYYYYYWYYYYYyyO.",
      ".OYYYYWYYYYyyO..",
      "..OOYYYYYyyOO...",
      "...OYYYYyyyO....",
      "...OYYYyyyyO....",
      "...OYyyOyyyO....",
      "...OyyO.OyyO....",
      "..OyOO...OOyO...",
      "...O.......O....",
      "................",
    ],
    ],
  },
  "crown": {
    palette: {
      "O": "#0d0b10", // outline
      "R": "#e8443a", // red
      "Y": "#ffd23f", // gold
      "y": "#d1901c", // gold shadow
      "W": "#ffffff", // white
      "B": "#3fa4f5", // blue
    },
    frames: [
    // Frame 1
    [
      ".......OO.......",
      "......OWYO......",
      ".O....OYYO....O.",
      "OWO....OO....OYO",
      "OYO...OYO....OYO",
      ".OO..OYYYO..O.O.",
      ".OYO.OYYYO.OyO..",
      ".OYYOYYYYYOyyO..",
      ".OYYYYYYYYyyyO..",
      ".OyyyyyyyyyyyyO.",
      ".OYWYYYYYYyyyyO.",
      ".OYYRYYBBYyRyyO.",
      ".OyyyyyyyyyyyyO.",
      "..OOOOOOOOOOOO..",
      "................",
      "................",
    ],
    ],
  },
  "claw": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "c": "#a8ecff", // cyan light
    },
    frames: [
    // Frame 1
    [
      "......O...O...O.",
      ".....OWO.OWO.OWO",
      ".....OWO.OWO.OWO",
      "....OWWOOWWOOWWO",
      "....OWcOOWcOOWcO",
      "....OWcOOWcOOWcO",
      "...OWWcOWWcOWWcO",
      "...OWcOOWcOOWcO.",
      "..OWWcOWWcOWWcO.",
      "..OWcOOWcOOWcO..",
      ".OWWcOWWcOWWcO..",
      ".OWOOOWOOOWOO...",
      "OWWOOWWOOWWO....",
      "OWO.OWO.OWO.....",
      ".O...O...O......",
      "................",
    ],
    ],
  },
  "shield": {
    palette: {
      "O": "#0d0b10", // outline
      "S": "#bcc5d2", // steel
      "s": "#717c8f", // steel shadow
      "H": "#f1f5fa", // steel highlight
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "Y": "#ffd23f", // gold
      "y": "#d1901c", // gold shadow
    },
    frames: [
    // Frame 1
    [
      "................",
      "..OOOOOOOOOOO...",
      ".OHHHHHHSssssO..",
      ".OHRRRRRrrrrsO..",
      ".OHRRRRYYrrrsO..",
      ".OSRRYRRrrYrsO..",
      ".OSRRRRRrrrrsO..",
      ".OSRRRYYYYrrsO..",
      ".OSRRRYYYyrrsO..",
      ".OSSRRRYyrrssO..",
      "..OSRRRRrrrsO...",
      "..OSSRRRrrssO...",
      "...OOSSRSsOO....",
      ".....OSSSO......",
      "......OSO.......",
      ".......O........",
    ],
    ],
  },
  "spark": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "B": "#3fa4f5", // blue
      "c": "#a8ecff", // cyan light
    },
    frames: [
    // Frame 1
    [
      "......OBO.......",
      "......OBO...O...",
      "......OBO..OcO..",
      "......OcO...O...",
      "......OcO.......",
      ".....OBWBO......",
      "OOOOOBBWBBOOOOO.",
      "BBBccWWWWcccBBBO",
      "OOOOOBBWWBOOOOO.",
      ".....OBcBO......",
      "......OcO.......",
      "..O...OcO.......",
      ".OcO..OBO.......",
      "..O...OBO.......",
      "......OBO.......",
      ".......O........",
    ],
    ],
  },
  "hourglass": {
    palette: {
      "O": "#0d0b10", // outline
      "Y": "#ffd23f", // gold
      "y": "#d1901c", // gold shadow
      "W": "#ffffff", // white
      "T": "#9a6538", // wood
      "t": "#5c3a1f", // wood shadow
      "g": "#cfefff", // glass
    },
    frames: [
    // Frame 1
    [
      "..OOOOOOOOOOOO..",
      ".OTTTTTTTTTTTTO.",
      ".OttttttttttttO.",
      ".OtOWggggggOOtO.",
      ".OtOgYYYYYgOOtO.",
      ".OtOOgYYYgO.OtO.",
      ".OtO.OgYgO..OtO.",
      ".OtO.OgYgO..OtO.",
      ".OtO.OgYgO..OtO.",
      ".OtOOOgYgO..OtO.",
      ".OtOWggYggO.OtO.",
      ".OtOggYYYggOOtO.",
      ".OtOgyyyyyyOOtO.",
      ".OTTTTTTTTTTTTO.",
      ".OttttttttttttO.",
      "..OOOOOOOOOOOO..",
    ],
    ],
  },
  "map-pin": {
    palette: {
      "O": "#0d0b10", // outline
      "R": "#e8443a", // red
      "r": "#9c2424", // red shadow
      "W": "#ffffff", // white
      "w": "#c9d2dc", // white shadow
      "P": "#ffc2d4", // paw pad
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO......",
      "...OORRRRROO....",
      "..ORRRRRRRRrO...",
      "..ORPRRRRRRrO...",
      ".ORPRRWWWRrrrO..",
      ".ORPRWWWWWrrrO..",
      ".ORRRWWWwwrrrO..",
      ".ORRRRWwwrrrrO..",
      "..ORRRrrrrrrO...",
      "..OrrrrrrrrrO...",
      "...ORrrrrrrO....",
      "....ORRRrrO.....",
      ".....ORRrO......",
      ".....ORRrO......",
      "......ORO.......",
      ".......O........",
    ],
    ],
  },
  "gem-common": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "L": "#f4f4f5", // gem light
      "M": "#a1a1aa", // gem
      "D": "#52525b", // gem dark
      "X": "#71717a", // gem facet
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO......",
      "...OOMMMMMOO....",
      "..OMMMMMMMMXO...",
      ".OMMMLMMMLXXXO..",
      ".OMMLWMMMLMXXO..",
      "OMMLWWLLLMMMMMO.",
      "OMMMMLLLLLXXMMO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMMLLLMMMDDO.",
      ".OXXMMXXXMMDDO..",
      ".OXXXMXXXMDDDO..",
      "..OXXDDDDDDDO...",
      "...OODDDDDOO....",
      ".....OOOOO......",
      "................",
    ],
    ],
  },
  "gem-uncommon": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "L": "#bbf7d0", // gem light
      "M": "#22c55e", // gem
      "D": "#166534", // gem dark
      "X": "#15803d", // gem facet
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO......",
      "...OOMMMMMOO....",
      "..OMMMMMMMMXO...",
      ".OMMMLMMMLXXXO..",
      ".OMMLWMMMLMXXO..",
      "OMMLWWLLLMMMMMO.",
      "OMMMMLLLLLXXMMO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMMLLLMMMDDO.",
      ".OXXMMXXXMMDDO..",
      ".OXXXMXXXMDDDO..",
      "..OXXDDDDDDDO...",
      "...OODDDDDOO....",
      ".....OOOOO......",
      "................",
    ],
    ],
  },
  "gem-rare": {
    palette: {
      "O": "#0d0b10", // outline
      "W": "#ffffff", // white
      "L": "#bfdbfe", // gem light
      "M": "#3b82f6", // gem
      "D": "#1e3a8a", // gem dark
      "X": "#1d4ed8", // gem facet
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO......",
      "...OOMMMMMOO....",
      "..OMMMMMMMMXO...",
      ".OMMMLMMMLXXXO..",
      ".OMMLWMMMLMXXO..",
      "OMMLWWLLLMMMMMO.",
      "OMMMMLLLLLXXMMO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMMLLLMMMDDO.",
      ".OXXMMXXXMMDDO..",
      ".OXXXMXXXMDDDO..",
      "..OXXDDDDDDDO...",
      "...OODDDDDOO....",
      ".....OOOOO......",
      "................",
    ],
    ],
  },
  "gem-legendary": {
    palette: {
      "O": "#0d0b10", // outline
      "Y": "#ffd23f", // gold
      "W": "#ffffff", // white
      "L": "#fef3c7", // gem light
      "M": "#fbbf24", // gem
      "D": "#92400e", // gem dark
      "X": "#d97706", // gem facet
    },
    frames: [
    // Frame 1
    [
      ".....OOOOO..OYO.",
      "...OOMMMMMOOYWYO",
      "..OMMMMMMMMXOYO.",
      ".OMMMLMMMLXXXO..",
      ".OMMLWMMMLMXXO..",
      "OMMLWWLLLMMMMMO.",
      "OMMMMLLLLLXXMMO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMLLLLLXXDDO.",
      "OMMMMMLLLMMMDDO.",
      ".OXXMMXXXMMDDO..",
      ".OXXXMXXXMDDDO..",
      "..OXXDDDDDDDO...",
      "...OODDDDDOO....",
      ".....OOOOO......",
      "................",
    ],
    ],
  },
};
