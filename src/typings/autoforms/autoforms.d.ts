/// <reference path="../meteor/meteor.d.ts"/>
/// <reference path="../simple-schema/simple-schema.d.ts"/>

//https://github.com/aldeed/meteor-autoform#callbackshooks





declare module "meteor/aldeed:autoform" {


  import { Blaze } from "meteor/blaze";
  import { DDP } from "meteor/ddp";
  import { Meteor } from "meteor/meteor";
  import { Mongo } from "meteor/mongo";

  export module AutoForm {

    interface AutoFormOptions<T> {
      collection?: () => Mongo.Collection<T>;
      schema?: SimpleSchema;
      doc?: T;
      /**
      * Required. This is used as the id attribute on the rendered form element, so it must be unique within your entire application. It's required because we use it to set up a form-specific validation context and to preserve input values when a "hot code push" happens.
      */
      id: any;
      /**
      * Optional. See the "Fine Tuning Validation" section.
      */
      validation?: string;
      /**
      * Optional. See the "Templates" section.
      */
      template?: string;
      /**
      * Optional. The form type. Default if not provided is "normal". See Form Types.
      */
      type?: string;
      /**
      * Optional. When type is "method" or "method-update", indicate the name of the Meteor method in this attribute.
      */
      meteormethod?: string;
      /**
      * Optional. When type is "method" or "method-update", provide an alternative DDP Connection that should be used to call the Meteor method in this attribute.
      */
      ddp?: DDP.DDPStatic;
      /**
      * Optional. The form is automatically reset for you after a successful submission action. You can skip this by setting this attribute to false.
      */
      resetOnSuccess?: boolean;
      /**
      * Optional. Set to true to enable automatic form submission for a type="update" form. Whenever the form change event is emitted, the change will be automatically saved to the database.
      */
      autosave?: boolean;
      /**
      * Optional. Set to true to enable automatic form submission for a type="update form on keyup event. Whenever a keyup event is emitted on a form field, the change will be automatically saved to the database (throttled to 500ms). It's best to set trimStrings=false when using this option. If you don't, spaces may be deleted while typing.
      */
      autosaveOnKeyup?: boolean;
      /**
      * Optional. Set to false for an insert or update form to skip filtering out unknown properties when cleaning the form document.
      */
      filter?: boolean;
      /**
      * Optional. Set to false for an insert or update form to skip autoconverting property values when cleaning the form document.
      */
      autoConvert?: boolean;
      /**
      * Optional. Set to false for an insert or update form to keep empty string values when cleaning the form document.
      */
      removeEmptyStrings?: boolean;
      /**
      * Optional. Set to false for an insert or update form to keep leading and trailing spaces for string values when cleaning the form document.
      */
      trimStrings?: boolean;
      /**
      * Optional. Set to true for an update form that is updating specific array items. Note that there is a quirk of MongoDB that will create objects instead of arrays when this is set to true, if there is not already an array in the database. So if you set this to true, be sure that the corresponding array property is never null or missing in the database. It must always be an array with 0 or more items.
      */
      setArrayItems?: boolean;
      /**
      * Optional. Set to false to disable preserving of form values across hot refreshes. This can sometimes help resolve issues with sticky form values.
      */
      preserveForm?: boolean;
    }

    interface QuickFormOptions<T> extends AutoFormOptions<T> {
      /**
      * Two additional type values are supported: "readonly" and "disabled".
      */
      type?: string;
      /**
      * Set the class attribute for the rendered submit button. Some templates may provide a default class if you don't set this.
      */
      buttonClasses?: string;
      /**
      * The submit button content. If you don't set this, "Submit" is used. If you set this to false, no submit button is rendered.
      */
      buttonContent?: string;
      /**
      * Optional. Bind an array or specify a comma-delimited string of field names to include. Only the listed fields (and their subfields, if any) will be included, and they'll appear in the order you specify.
      */
      fields?: Array<string>;
      /**
      * Optional. Bind an array or specify a comma-delimited string of field names to omit from the generated form. All first-level schema fields except the fields listed here (and their subfields, if any) will be included.
      */
      omitFields?: Array<string>;
    }


    interface HookMethodContext<T> {
      done: (error?: Meteor.Error, result?: any) => void;
      /**
      * Call this to add a custom validation error that will not be overridden by subsequent revalidations on the client. This can be useful if you need to show a form error based on errors coming back from the server, and you don't want it to disappear when fields are revalidated on the client on blur, keyup, etc. The sticky error will go away when the form is reset (such as after a successful submission), when the form instance is destroyed, or when you call this.removeStickyValidationError(key) in any hook.
      */
      addStickyValidationError: (key: string, type: string, value: any) => void;
      /**
       * The input element that was changed to cause this form submission (if the submission was due to autosave)
       */
      autoSaveChangedElement?: any;
      /**
       * The collection attached to the form (from collection attribute)
       */
      collection?: Mongo.Collection<T>;
      /**
       * The current document attached to the form (from doc attribute)
       */
      currentDoc?: T;
      /**
       * The _id attribute of the doc attached to the form, if there is one, or for an type='insert' form, the _id of the newly inserted doc, if one has been inserted.
       */
      docId?: string;
      /**
       * The browser submit event
       */
      event?: Event;
      /**
       * The object containing all the form attributes from the autoForm or quickForm
       */
      formAttributes?: AutoFormOptions<T>;
      /**
       * The form's id attribute (useful in a global hook)
       */
      formId?: string;
      /**
       * The gathered current form values, as a normal object
       */
      insertDoc?: T;
      /**
      * Call this to remove a sticky validation error you previously added to the current form instance.
      */
      removeStickyValidationError?: (key: string) => void;
      /**
      * Call this if you need to reset the form
      */
      resetForm(): () => void;
      /**
       * The SimpleSchema instance used for validating the form
       */
      ss?: SimpleSchema;
      /**
       * This is true if this.ss is an override schema, meaning it's coming from a schema attribute on the autoForm or quickForm, but there is also a collection attribute pointing to a collection that has its own schema attached.
       */
      ssIsOverride?: boolean;
      /**
       * The autoForm template instance
       */
      template?: Blaze.TemplateInstance;
      /**
       * The gathered current form values, as a mongo modifier object suitable for passing to a collection update call
       */
      updateDoc?: T;
      /**
       * The validation context used for the form. You can use this to check or add (non-sticky) invalid keys.
       */
      validationContext?: SimpleSchemaValidationContext;
    }

    interface SingleHookDefinition<T> {
      before?: Object;
      after?: Object;
      formToDoc?: (doc?: Object) => T;
      docToForm?: (doc: T, ss?: SimpleSchema) => Object;
      onSubmit?: (insertDoc?: T, updateDoc?: T, currentDoc?: T) => void;
      onSuccess?: (formType?: string, result?: any) => void;
      onError?: (formType: string, error: Meteor.Error) => void;
      beginSubmit?: () => void;
      endSubmit?: () => void;
    }

    interface MultiHookDefinition<T> {
      [key: string]: SingleHookDefinition<T>;
    }

    interface InputTypeDefinition {
      /** The name of the template to use, which you've defined in a .html file. */
      template: string;

      /**  A function that adjusts the initial value of the field, which is then
      * available in your template as this.value.
      * You could use this, for example, to change a Date object to a string representing the date.
      * You could also use a helper in your template to achieve the same result.
      */
      valueIn?: Function;

      /**
      * A function that AutoForm calls when it wants to know what the current value
      * stored in your widget is. In this function, this is the jQuery object
      * representing the element that has the data-schema-key attribute in your
      * custom template. So, for example, in a simple case your valueOut function
      * might just do return this.val().
      */
      valueOut: () => any;

      /**
      * An object that defines converters for one or more schema types. Generally you will use
      * valueOut to return a value for the most common or logical
      * schema type, and then define one or more converter functions here.
      *  The converters receive the valueOut value as an argument and
      * should then return either the same value or a type converted/adjusted variation of it.
      * The possible converter keys are: "string", "stringArray", "number", "numberArray",
      * "boolean", "booleanArray", "date", and "dateArray". Refer to the built-in type definitions for examples.
      */
      valueConverters?: Object;

      /**
      * A function that adjusts the context object that your custom template receives.
      * That is, this function accepts an object argument,
      * potentially modifies it, and then returns it. That returned object then
      * becomes this in your custom template. If you need access to attributes of the
      * parent autoForm in this function, use AutoForm.getCurrentDataForForm() to get them.
      */
      contextAdjust?: Function;
    }

    function addHooks<T>(formIds: Array<string> | string, hooks: SingleHookDefinition<T>): void;
    function hooks<T>(hookDefinitions: MultiHookDefinition<T>): void;
    function resetForm(formId: string, template?: Blaze.TemplateInstance): void;
    function setDefaultTemplateForType(type: string, template: string): void;
    function getDefaultTemplateForType(type: string, template: string): string;
    function getFieldValue(fieldName: string, formId?: string): any;
    function validateForm(fieldName: string): boolean;
    function getValidationContext(formId: string): SimpleSchemaValidationContext;
    function addInputType(name: string, definition: InputTypeDefinition): void;

    var getFormId: Function;
  }
}
