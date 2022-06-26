import { Helper } from "../../../lib/HelperDecorator";
import { TemplateDefinition } from "../../../lib/TemplateDefinitionDecorator";

declare var MochaWeb: any;


@TemplateDefinition("testTemplate")
class TestTemplate {
  @Helper
  static testHelper() {
    return "TestOutput";
  }

  static other() {

  }
}



describe("TemplateDecoratorTester - Server-Side", function () {
  it("is able to compile on server side", function () {
    chai.assert.equal(TestTemplate.testHelper(), "TestOutput");
  });
});
