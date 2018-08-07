import {LocalCollection} from "./3rdParty/minimongo-standalone/minimongo-standalone";
import * as chai from "chai";

interface TestDAO {
  bla: string;
}

describe("Minimongo Standalone integrates", function() {

  it("Test insert", function() {
    // Arrange
    let collection = new LocalCollection<TestDAO>("test");

    // Act
    collection.insert({ "bla": "blub" });

    // Assert
    let cursor = collection.find();
    let retrieved = cursor.fetch()[0];

    chai.assert.equal(cursor.count(), 1);
    chai.assert.isDefined(retrieved);
    chai.assert.isNotNull(retrieved);
    chai.assert.equal(retrieved.bla, "blub");

  });

  it("Test remove", function() {
    // Arrange
    let collection = new LocalCollection<TestDAO>("test");
    collection.insert({ "bla": "blub" });

    // Act
    let firstCount = collection.find().count();
    collection.remove({ "bla": "blub" });
    let secondCount = collection.find().count();

    // Assert
    chai.assert.equal(firstCount, 1, "No data was inserted.");
    chai.assert.equal(secondCount, 0, "Removal of data failed.");
  });

  it("Test update", function() {
    // Arrange
    let collection = new LocalCollection<TestDAO>("test");
    let id = collection.insert({ "bla": "blub" });

    // Act
    collection.update({ "_id": id }, {
      "$set": {"bla": "yep"}
    });


    // Assert
    let cursor = collection.find();
    let retrieved = cursor.fetch()[0];
    chai.assert.equal(cursor.count(), 1);
    chai.assert.isDefined(retrieved);
    chai.assert.isNotNull(retrieved);
    chai.assert.equal(retrieved.bla, "yep");
  });

});
