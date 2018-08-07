import {Match} from "meteor/check";

// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions({
  requiredFor: Match.Optional(String)
});

export default function requiredForValidator(context: CustomValidatorContext) {
  let requiredFor = context.definition.requiredFor;
  let hasSchemaKeyRequiredFor: boolean = requiredFor !== undefined && requiredFor !== null && requiredFor !== "";
  let typeField = context.field("type");

  if (!hasSchemaKeyRequiredFor || !typeField) {
    return;
  }

  let type = <string>typeField.value;

  let shouldBeRequired = requiredFor === type;

  if (shouldBeRequired) {
    // inserts
    if (!context.operator) {
      if (!context.isSet || context.value === null || context.value === "") return "required";
    }

    // updates
    else if (context.isSet) {
      if (context.operator === "$set" && context.value === null || context.value === "") return "required";
      if (context.operator === "$unset") return "required";
      if (context.operator === "$rename") return "required";
    }
  }

}

/**
 * ###### Vorraussetzung ######
 * Datenobjekt muss Feld mit dem Namen 'type' besitzen. Bestenfalls wird auch die Menge aller möglichen
 * Einträge in 'type' durch das 'allowedValues' Attribut begrenzt.
 * ############################
 *
 * Wenn ein Feld im Schema das Attribut 'requiredFor : "TypName"' gesetzt hat, dann ist dieses Feld immer required,
 * wenn im Feld type der Inhalt "TypName" steht.
 *
 * HINWEIS: Das besagte Objekt mit der "requiredFor"-Eigenschaft muss zusätzlich die Eigenschaft "optional: true" haben.
 *
 */

SimpleSchema.addValidator(function() {
  requiredForValidator(<CustomValidatorContext>this);
});
