// Pixel-art gallop cycle for the Siamese from the hero page, facing right.
// One character per pixel; "." is transparent. Colours are in CAT_PALETTE.
// Frames play left to right in a loop.

export const CAT_PALETTE: Record<string, string> = {
  O: "#24170f", // outline
  K: "#1a120c", // nose, mouth, pupil
  D: "#4a3728", // seal point (ears, mask, paws, tail)
  d: "#7a5a42", // point blend
  C: "#ecdfc8", // cream coat
  c: "#d2bc98", // coat shadow
  L: "#f7eedf", // coat highlight
  B: "#4f9be8", // eye
  b: "#2f6fc0", // eye rim
  W: "#ffffff", // eye glint
};

export const CAT_FRAMES: readonly (readonly string[])[] = [
  // Frame 1
  [
    "........................O....OO.....",
    ".......................ODO..ODDO....",
    ".......................ODDOODDDO....",
    ".......................ODDDODDdO....",
    "O.....................ODDDDLCCdDO...",
    "DO....................ODDCCCCCCCO...",
    "DDO...................ODCCCCCddddO..",
    "DDDOO.....OOOO......OOOCCCCdddDDDdO.",
    "DDDDdOOOOOLLLLOOOOOOLLLCCCCddDBWDDdO",
    "ODDdddddLLCCCCLLLLLLCCCCCCddDbBKDDDO",
    ".OdddddCCCCCCCCCCCCCCCCCCCddDDDDDDKO",
    "..OddddCCCCCCCCCCCCCCCCCCCddDDDDDDDO",
    "...OOddCCCCCCCCCCCCCCCCCCCCddDDDDKdO",
    ".....OcCCCCCCCCCCCCCCCCCCCccdddddOO.",
    "......OCCCCCCCCCCCCCCCCCCCccccOOO...",
    "......OCCCCCCCCCCCCCCCCCCCOOOO......",
    "......OCCCCCCCCCCCCCccccCCOO........",
    ".....OOdddcccccccccccccccdddOO......",
    "....OdddddccccccccccOOOOcdddddOO....",
    "...ODDdddDOOOOOOOOOO....ODddddDDO...",
    "..ODDDdDDO...............ODDdDDDDO..",
    ".ODDDDDDO.................ODDDDDDDO.",
    "..ODDDDO...................ODDDDDO..",
    "...OODO.....................OODOO...",
    ".....O........................O.....",
    "....................................",
  ],
  // Frame 2
  [
    "....................................",
    "........................O....OO.....",
    ".......................ODO..ODDO....",
    ".......................ODDOODDDO....",
    ".......................ODDDODDdO....",
    "......................ODDDDLCCdDO...",
    "......................ODDCCCCCCCO...",
    "......................ODCCCCCddddO..",
    "O.........OOOO......OOOCCCCdddDDDdO.",
    "DOOOOO..OOLLLLOOOOOOLLLCCCCddDBWDDdO",
    "DDDdddOOLLCCCCLLLLLLCCCCCCddDbBKDDDO",
    "DDDDdddLCCCCCCCCCCCCCCCCCCddDDDDDDKO",
    "DDDddddCCCCCCCCCCCCCCCCCCCddDDDDDDDO",
    "OOOddddCCCCCCCCCCCCCCCCCCCCddDDDDKdO",
    "...OOOcCCCCCCCCCCCCCCCCCCCccdddddOO.",
    "......OCCCCCCCCCCCCCCCCCCCccccOOO...",
    "......OcCCCCCCCCCCCCCCCCCcOOOO......",
    "......OcCCCCCCCCCCCCCCCCCcO.........",
    ".......OCddCCcccccccCCdddO..........",
    ".......OdddCccccccccDDdddO..........",
    ".......OdddDDOOOOOOODDDdddO.........",
    "......ODDdDDO......ODDDdDDO.........",
    ".....ODDDDDDO......ODDDdDDDO........",
    ".....ODDDDDDO......ODDDODDDO........",
    "......ODOODO........ODO.ODO.........",
    ".......O..O..........O...O..........",
  ],
  // Frame 3
  [
    "........................O....OO.....",
    ".OO....................ODO..ODDO....",
    "ODDO...................ODDOODDDO....",
    "DDDDO..................ODDDODDdO....",
    "DDDDO.................ODDDDLCCdDO...",
    "ODDDDO................ODDCCCCCCCO...",
    ".ODDDdO...............ODCCCCCddddO..",
    "..ODdddO..OOOO......OOOCCCCdddDDDdO.",
    "..OdddddOOLLLLOOOOOOLLLCCCCddDBWDDdO",
    "...OddddLLCCCCLLLLLLCCCCCCddDbBKDDDO",
    "....OddCCCCCCCCCCCCCCCCCCCddDDDDDDKO",
    ".....OdCCCCCCCCCCCCCCCCCCCddDDDDDDDO",
    "......OCCCCCCCCCCCCCCCCCCCCddDDDDKdO",
    ".....OLCCCCCCCCCCCCCCCCCCCccdddddOO.",
    "......OCCCCCCCCCCCCCCCCCCCccccOOO...",
    "......OcCCCCCCCCCCCCCCCCccOOOO......",
    "......OcccCCCCCCCCCCCCCcccO.........",
    ".......OcccccdCCccCCCdCcOO..........",
    "........OOccdddCccCCdddO............",
    "..........OOOdddOODDdddO............",
    "............OddddDDdddO.............",
    "............ODdDDDDDDdO.............",
    ".............ODDDDDDDO..............",
    "..............ODDDDDDO..............",
    "...............OODODO...............",
    ".................O.O................",
  ],
  // Frame 4
  [
    ".......................ODO..ODDO....",
    "OO.....................ODDOODDDO....",
    "DDO....................ODDDODDdO....",
    "DDDO..................ODDDDLCCdDO...",
    "DDDO..................ODDCCCCCCCO...",
    "DDDDO.................ODCCCCCddddO..",
    "ODDDdOO...OOOO......OOOCCCCdddDDDdO.",
    ".ODddddOOOLLLLOOOOOOLLLCCCCddDBWDDdO",
    ".OddddddLLCCCCLLLLLLCCCCCCddDbBKDDDO",
    "..OddddCCCCCCCCCCCCCCCCCCCddDDDDDDKO",
    "...OOddCCCCCCCCCCCCCCCCCCCddDDDDDDDO",
    ".....OdCCCCCCCCCCCCCCCCCCCCddDDDDKdO",
    ".....OcCCCCCCCCCCCCCCCCCCCccdddddOO.",
    "......OCCCCCCCCCCCCCCCCCCCccccOOO...",
    "......OcCCCCCCCCCCCCCCCCCCOOOO......",
    "......OcccCCCCCCCCCCcccCCCO.........",
    ".......OccCCCCcccccccccCdddO........",
    "........OOCdddccccccOOOcddddO.......",
    ".........ODdddOOOOOO..ODDddDDO......",
    ".........ODdddO........ODDdDDDO.....",
    ".........ODdddO.........ODDDDDDO....",
    "........ODDDDDO.........ODDDDDO.....",
    "........ODDDDDDO.........ODDDO......",
    "........ODDDDDDO..........ODO.......",
    ".........ODOODO............O........",
    "..........O..O......................",
  ],
];

export const CAT_WIDTH = CAT_FRAMES[0][0].length;
export const CAT_HEIGHT = CAT_FRAMES[0].length;
