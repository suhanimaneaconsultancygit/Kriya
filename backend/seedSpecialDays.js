require("dotenv").config();
const mongoose = require("mongoose");
const SpecialDay = require("./models/SpecialDay");

const specialDays = [
  // January
  { date: "01-01", title: "New Year's Day", description: "The first day of the new year, celebrated worldwide." },
  { date: "01-14", title: "Makar Sankranti", description: "Indian harvest festival marking the sun's transit into Capricorn." },
  { date: "01-26", title: "Republic Day (India)", description: "Celebrates the date India's constitution came into effect in 1950." },
  { date: "01-28", title: "Data Privacy Day", description: "Promotes awareness about data protection and privacy practices." },

  // February
  { date: "02-04", title: "World Cancer Day", description: "Raises awareness and promotes action against cancer globally." },
  { date: "02-11", title: "International Day of Women in Science", description: "Recognizes and promotes the role of women in science." },
  { date: "02-14", title: "Valentine's Day", description: "A day to celebrate love and affection between people." },
  { date: "02-20", title: "World Day of Social Justice", description: "Promotes efforts to tackle issues of poverty and exclusion." },

  // March
  { date: "03-08", title: "International Women's Day", description: "Celebrates the social, cultural, and political achievements of women." },
  { date: "03-14", title: "Pi Day", description: "Celebrates the mathematical constant π (3.14...)." },
  { date: "03-15", title: "World Consumer Rights Day", description: "Raises awareness about consumer rights and needs." },
  { date: "03-20", title: "World Happiness Day", description: "A UN initiative to recognize happiness as a fundamental human goal." },
  { date: "03-21", title: "World Poetry Day", description: "Promotes reading, writing, publishing, and teaching of poetry." },
  { date: "03-22", title: "World Water Day", description: "Focuses attention on the importance of freshwater." },
  { date: "03-23", title: "World Meteorological Day", description: "Commemorates the establishment of the World Meteorological Organization." },

  // April
  { date: "04-01", title: "April Fools' Day", description: "A day of practical jokes and humour." },
  { date: "04-02", title: "World Autism Awareness Day", description: "Raises awareness to improve the quality of life for autistic individuals." },
  { date: "04-07", title: "World Health Day", description: "WHO initiative to draw attention to important global health issues." },
  { date: "04-22", title: "Earth Day", description: "Annual event to demonstrate support for environmental protection." },
  { date: "04-23", title: "World Book Day", description: "Promotes reading, publishing, and the protection of intellectual property." },
  { date: "04-24", title: "National Steel Day (USA)", description: "Recognizes the importance of the steel industry in development." },
  { date: "04-26", title: "World Intellectual Property Day", description: "Raises awareness of IP rights and their role in innovation." },

  // May
  { date: "05-01", title: "International Labour Day", description: "Celebrates the achievements of workers and labour movements worldwide." },
  { date: "05-03", title: "World Press Freedom Day", description: "Promotes freedom of the press and journalistic rights." },
  { date: "05-04", title: "Star Wars Day", description: "Fans celebrate the Star Wars franchise. 'May the 4th be with you!'" },
  { date: "05-15", title: "International Day of Families", description: "Highlights the importance of families and related issues." },
  { date: "05-17", title: "World Telecommunication Day", description: "Raises awareness of the possibilities of the internet." },
  { date: "05-31", title: "World No Tobacco Day", description: "Informs the public about the dangers of tobacco use." },

  // June
  { date: "06-01", title: "World Milk Day", description: "Recognizes the importance of milk as a global food." },
  { date: "06-05", title: "World Environment Day", description: "The UN's principal vehicle for encouraging awareness and action for the environment." },
  { date: "06-08", title: "World Ocean Day", description: "Celebrates the ocean and promotes action to protect it." },
  { date: "06-17", title: "World Day to Combat Desertification", description: "Promotes public awareness of international efforts to combat desertification." },
  { date: "06-21", title: "World Music Day", description: "Celebrates music and encourages performances in public spaces." },
  { date: "06-23", title: "Women in Engineering Day", description: "Recognizes contributions of women engineers worldwide." },
  { date: "06-27", title: "Micro, Small and Medium Enterprises Day", description: "Raises awareness about MSMEs and their contribution to sustainable development." },

  // July
  { date: "07-01", title: "Doctor's Day (India)", description: "Pays tribute to the contribution of physicians to society." },
  { date: "07-11", title: "World Population Day", description: "Focuses attention on the urgency and importance of population issues." },
  { date: "07-14", title: "Bastille Day", description: "French national holiday commemorating the storming of the Bastille." },
  { date: "07-18", title: "Nelson Mandela International Day", description: "Celebrates Nelson Mandela's birthday and his contribution to peace." },

  // August
  { date: "08-09", title: "Quit India Day", description: "Commemorates the Quit India Movement launched by Mahatma Gandhi in 1942." },
  { date: "08-12", title: "World Elephant Day", description: "Brings attention to the preservation and protection of elephants." },
  { date: "08-15", title: "Independence Day (India)", description: "Celebrates India's independence from British rule in 1947." },
  { date: "08-23", title: "International Day for the Remembrance of the Slave Trade", description: "Inscribes the memory of the tragedy of the slave trade in the memory of all peoples." },

  // September
  { date: "09-05", title: "International Day of Charity", description: "Raises awareness and provides a common platform for charity activities." },
  { date: "09-08", title: "International Literacy Day", description: "Highlights the importance of literacy to individuals, communities, and societies." },
  { date: "09-15", title: "International Day of Democracy", description: "Promotes and upholds democratic principles worldwide." },
  { date: "09-16", title: "World Ozone Day", description: "Commemorates the signing of the Montreal Protocol to phase out substances that deplete the ozone layer." },
  { date: "09-21", title: "International Day of Peace", description: "Dedicated to world peace and the absence of war and violence." },
  { date: "09-27", title: "World Tourism Day", description: "Promotes awareness of the role of tourism within the international community." },

  // October
  { date: "10-01", title: "International Day of Older Persons", description: "Raises awareness of issues affecting the elderly." },
  { date: "10-02", title: "Gandhi Jayanti (India)", description: "Celebrates the birth anniversary of Mahatma Gandhi." },
  { date: "10-05", title: "World Teachers' Day", description: "Celebrates teachers and recognizes their importance in transforming education." },
  { date: "10-10", title: "World Mental Health Day", description: "Raises awareness of mental health issues and mobilizes efforts in support of mental health." },
  { date: "10-16", title: "World Food Day", description: "Promotes worldwide awareness and action for those who suffer from hunger." },
  { date: "10-24", title: "United Nations Day", description: "Celebrates the anniversary of the UN Charter coming into effect in 1945." },
  { date: "10-31", title: "Halloween", description: "A celebration observed in many countries on the eve of All Saints' Day." },

  // November
  { date: "11-05", title: "World Tsunami Awareness Day", description: "Spreads awareness about tsunamis and the importance of early warning systems." },
  { date: "11-14", title: "Children's Day (India) / World Diabetes Day", description: "India celebrates Children's Day; globally it is World Diabetes Day." },
  { date: "11-19", title: "International Men's Day", description: "Celebrates the positive value men bring to the world, their families, and communities." },
  { date: "11-26", title: "Constitution Day (India)", description: "Celebrates the adoption of the Constitution of India in 1949." },

  // December
  { date: "12-01", title: "World AIDS Day", description: "Dedicated to raising awareness of the AIDS pandemic caused by HIV." },
  { date: "12-02", title: "National Pollution Control Day (India)", description: "Aims to create awareness about the prevention and control of industrial disasters." },
  { date: "12-03", title: "International Day of Persons with Disabilities", description: "Promotes the rights and well-being of persons with disabilities." },
  { date: "12-10", title: "Human Rights Day", description: "Marks the anniversary of the adoption of the Universal Declaration of Human Rights." },
  { date: "12-25", title: "Christmas Day", description: "Annual festival commemorating the birth of Jesus Christ." },
  { date: "12-31", title: "New Year's Eve", description: "The last day of the year, celebrated with festivities worldwide." },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await SpecialDay.deleteMany({});
    console.log("🗑️  Cleared existing special days");

    // Insert seed data
    const inserted = await SpecialDay.insertMany(specialDays);
    console.log(`🌱 Seeded ${inserted.length} special days successfully!`);

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
