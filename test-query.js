const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/usep_db', {
  logging: false
});

async function run() {
  try {
    const [results, metadata] = await sequelize.query("SELECT * FROM package_sub_questions LIMIT 10;");
    console.log("Sub questions:", results);
    const [ans, _] = await sequelize.query("SELECT * FROM exam_answers ORDER BY id DESC LIMIT 5;");
    console.log("Exam answers:", ans);
  } catch (e) {
    console.error(e);
  } finally {
    sequelize.close();
  }
}
run();
