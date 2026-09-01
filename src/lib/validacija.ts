// Провјера ФОРМАТА уноса (корак 1 из описа апликације).
//
// Ове функције не дирају базу — само провјеравају да ли је оно што је корисник
// уписао у траженом облику. Исте функције касније користи и сервер, да се
// корисник не би могао "провући" заобилазећи провјеру у прегледачу.

// Свих 30 слова српске ћирилице (велика и мала).
const CIRILICA_VELIKA = "АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ";
const CIRILICA_MALA = "абвгдђежзијклљмнњопрстћуфхцчџш";

// Једна ријеч имена: велико почетно ћирилично слово + бар једно мало ћирилично
// слово. Дозвољена је и цртица унутар ријечи (нпр. „Петровић-Јовановић"),
// гдје сваки дио почиње великим словом.
const RIJEC = `[${CIRILICA_VELIKA}][${CIRILICA_MALA}]+(?:-[${CIRILICA_VELIKA}][${CIRILICA_MALA}]+)*`;

// Цијело поље: двије или више ријечи раздвојених једним размаком
// (нпр. „Марко Марковић" или „Ана Марија Марковић").
const IME_PREZIME_RE = new RegExp(`^${RIJEC}(?: ${RIJEC})+$`);

export function validnoImePrezime(vrijednost: string): boolean {
  return IME_PREZIME_RE.test(vrijednost.trim());
}

// Тачно 13 цифара (нпр. „2707201112000").
export function validanBarKod(vrijednost: string): boolean {
  return /^[0-9]{13}$/.test(vrijednost.trim());
}

// Почиње са „3876" + тачно још 7 цифара = укупно 11 цифара, без размака/цртица.
export function validanTelefon(vrijednost: string): boolean {
  return /^3876[0-9]{7}$/.test(vrijednost.trim());
}

// Град мора бити један од понуђених у падајућем менију.
export function validanGrad(vrijednost: string, gradovi: string[]): boolean {
  return gradovi.includes(vrijednost);
}

// Провјера свих поља одједном. Враћа true само ако је СВЕ у траженом формату.
export function formatIspravan(unos: {
  imePrezime: string;
  grad: string;
  barKod: string;
  telefon: string;
  gradovi: string[];
}): boolean {
  return (
    validnoImePrezime(unos.imePrezime) &&
    validanGrad(unos.grad, unos.gradovi) &&
    validanBarKod(unos.barKod) &&
    validanTelefon(unos.telefon)
  );
}
