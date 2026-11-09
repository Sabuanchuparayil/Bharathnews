/** Evergreen NRI reference pages. Official links only; rules and fees change. */

export const GUIDES = [
  {
    slug: 'passport-renewal',
    title: 'Renew an Indian passport from the Gulf',
    summary: 'Where Malayali NRIs start a passport renewal, and which office actually issues it.',
    sections: [
      {
        heading: 'Start at Passport Seva',
        body: 'Renewals are filed on Passport Seva, not at a typing centre. Book the appointment for the Indian mission or outsourced centre that covers your emirate or city. Carry the current passport, residence visa, Emirates ID or iqama, and photographs in the size that mission asks for.',
      },
      {
        heading: 'Check the mission, not a forum',
        body: 'Document lists differ between the UAE, Saudi Arabia, Qatar, Kuwait, Oman, and Bahrain. Open the Indian mission for your city from the Ministry of External Affairs list before you pay anyone to “arrange” the slot.',
      },
    ],
    official: [
      { label: 'Passport Seva', href: 'https://www.passportindia.gov.in/' },
      { label: 'Indian missions abroad', href: 'https://www.mea.gov.in/indian-missions-abroad.htm' },
    ],
  },
  {
    slug: 'police-clearance',
    title: 'Police clearance for a Gulf visa or a new job',
    summary: 'A PCC is issued for a stated purpose. The Indian mission in your country publishes the current steps.',
    sections: [
      {
        heading: 'What it is',
        body: 'A police clearance certificate says whether a record exists against you in India, or in the country where you live, depending on who asked for it. Employers and visa desks name which one they want. A certificate made for a different purpose is often rejected.',
      },
      {
        heading: 'Where to apply',
        body: 'If the desk wants an Indian PCC while you live in the Gulf, follow the Indian mission’s PCC page for that country. If they want a local GCC clearance, that comes from the police or the ministry named on your visa checklist, not from the embassy.',
      },
    ],
    official: [
      { label: 'Indian missions abroad', href: 'https://www.mea.gov.in/indian-missions-abroad.htm' },
    ],
  },
  {
    slug: 'oci-card',
    title: 'OCI card for family who are not Indian citizens',
    summary: 'Overseas Citizen of India is the card that replaced PIO. Apply on the official OCI portal.',
    sections: [
      {
        heading: 'Who it is for',
        body: 'OCI is for eligible foreign citizens of Indian origin and their spouses, not for Indian passport holders. An Indian passport and an OCI card are not held together.',
      },
      {
        heading: 'How to file',
        body: 'Applications go through the OCI services portal. The mission that covers your Gulf city takes the biometrics and documents. Old PIO cards were deemed OCI; if a card is damaged or the photo is obsolete, use the portal’s reissue path rather than a new agent package.',
      },
    ],
    official: [
      { label: 'OCI services', href: 'https://ociservices.gov.in/' },
    ],
  },
  {
    slug: 'power-of-attorney',
    title: 'Power of attorney for property in Kerala',
    summary: 'A Gulf-signed power of attorney still has to be accepted by the Kerala office that will use it.',
    sections: [
      {
        heading: 'This is not a template',
        body: 'The wording depends on whether someone is selling land, collecting rent, or signing a bank paper. A lawyer in Kerala should draft it for that act. A generic download is a common reason sub-registrar offices send people back.',
      },
      {
        heading: 'Attestation',
        body: 'Sign it the way the Indian mission in your Gulf city attests documents, then register or adjudicate it in Kerala if the sub-registrar or bank asks. Confirm the current attestation steps on that mission’s site before you book a flight to do it in person.',
      },
    ],
    official: [
      { label: 'Indian missions abroad', href: 'https://www.mea.gov.in/indian-missions-abroad.htm' },
    ],
  },
  {
    slug: 'nre-nro-accounts',
    title: 'NRE and NRO accounts, in plain words',
    summary: 'Two Indian bank accounts NRIs mix up. The Reserve Bank of India sets the difference.',
    sections: [
      {
        heading: 'NRE',
        body: 'A Non-Resident External account holds money you earned outside India and brought in. Interest rules and repatriation are defined by the bank under RBI directions. It is not a place to park rent collected in India.',
      },
      {
        heading: 'NRO',
        body: 'A Non-Resident Ordinary account holds income that arose in India, such as rent, pension, or a sale. Tax and the amount you can send back abroad are not the same as on an NRE account. Ask the bank for the current RBI limit before you transfer a property sale.',
      },
    ],
    official: [
      { label: 'Reserve Bank of India', href: 'https://www.rbi.org.in/' },
    ],
  },
  {
    slug: 'sending-money-home',
    title: 'Sending money home from the Gulf',
    summary: 'Compare the amount that arrives in rupees, not the headline rate on a banner.',
    sections: [
      {
        heading: 'What to compare',
        body: 'Exchange houses, your Gulf bank, and Indian bank apps each show a rate and a fee. The figure that matters is the rupees credited after both. A “zero fee” rate is often worse than a small fee on a better rate.',
      },
      {
        heading: 'Gold is a different page',
        body: 'Dirham and rupee rates move with the bullion price. Use the gold page for 22K and 24K, and your bank for the remittance. Neither number is a jeweller’s making charge or a bank’s card rate.',
      },
    ],
    official: [
      { label: 'Gold rate today', href: '/money/gold-rate-today' },
    ],
  },
  {
    slug: 'aadhaar-from-abroad',
    title: 'Aadhaar updates while you live abroad',
    summary: 'UIDAI, not a Gulf typing shop, is the office that changes an Aadhaar record.',
    sections: [
      {
        heading: 'What you can do online',
        body: 'UIDAI lets you check status and update some fields online. Biometrics and many address changes still need a visit to an enrolment centre in India, or the path UIDAI currently publishes for NRIs. Do not hand the original Aadhaar PDF password to a middleman.',
      },
    ],
    official: [
      { label: 'UIDAI', href: 'https://uidai.gov.in/' },
    ],
  },
  {
    slug: 'overseas-voter',
    title: 'Voting in Indian elections from the Gulf',
    summary: 'Overseas electors are registered through the Election Commission, on the roll of the constituency in India.',
    sections: [
      {
        heading: 'Registration',
        body: 'An Indian citizen living abroad can apply to be an overseas elector in the constituency of the address on the passport. The Election Commission of India publishes the form and whether a particular election allows postal or in-person voting. Registration does not by itself mean a postal ballot will be posted to Dubai.',
      },
    ],
    official: [
      { label: 'Election Commission of India', href: 'https://www.eci.gov.in/' },
    ],
  },
  {
    slug: 'children-moving-back',
    title: 'Papers for children moving back to Kerala',
    summary: 'Schools ask for the last report, a birth certificate, and sometimes an equivalence note.',
    sections: [
      {
        heading: 'Collect them before you resign',
        body: 'Ask the Gulf school for a transfer certificate and the last two years of reports while you still have a parent pass to enter the campus. Birth certificates issued outside India may need attestation. The Indian mission’s attestation page is the checklist, not a school WhatsApp forward.',
      },
      {
        heading: 'Board and language',
        body: 'CBSE, state, and other boards do not treat every Gulf report the same way. The school in Kerala, or the board’s NRI admission note, says whether a test or an extra year applies. Confirm that in writing before you book tickets.',
      },
    ],
    official: [
      { label: 'Indian missions abroad', href: 'https://www.mea.gov.in/indian-missions-abroad.htm' },
    ],
  },
  {
    slug: 'emergency-contacts',
    title: 'When something goes wrong in the Gulf',
    summary: 'The Indian mission that covers your city is the first official contact, not a social media page.',
    sections: [
      {
        heading: 'Who to call',
        body: 'For a lost passport, an arrest, a death, or a labour dispute that needs the mission, use the phone and email on that mission’s own website. MEA lists every mission. Keep a photo of your passport and visa in a place your family in Kerala can open.',
      },
      {
        heading: 'Labour cases',
        body: 'Wage and contract disputes are first a matter for the labour authority of the country that issued the visa. The mission can advise citizens; it does not replace the local labour court or the employer’s contract.',
      },
    ],
    official: [
      { label: 'Indian missions abroad', href: 'https://www.mea.gov.in/indian-missions-abroad.htm' },
      { label: 'Ministry of External Affairs', href: 'https://www.mea.gov.in/' },
    ],
  },
];

export function getGuide(slug) {
  return GUIDES.find(guide => guide.slug === slug) || null;
}
