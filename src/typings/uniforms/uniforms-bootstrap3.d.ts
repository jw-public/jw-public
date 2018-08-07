/// <reference path="../meteor/meteor.d.ts"/>
/// <reference path="../simple-schema/simple-schema.d.ts"/>

//https://github.com/aldeed/meteor-autoform#callbackshooks





declare module "uniforms-bootstrap3" {


    export interface AutoFormProps {
        schema: SimpleSchema;
        onSubmit(data: any): void;
    }
    export class AutoForm extends React.Component<AutoFormProps, {}> { }

    export interface TextFieldProps {
        name: string;
    }
    export class TextField extends React.Component<TextFieldProps, {}> { }

    export interface AutoFieldProps extends TextFieldProps {
    }
    export class AutoField extends React.Component<AutoFieldProps, {}> { }


    export interface SubmitFieldProps {
        className: string;
    }

    export class SubmitField extends React.Component<SubmitFieldProps, {}> { }


    export interface HiddenFieldProps {
        name: string;
        value: any;
    }

    export class HiddenField extends React.Component<HiddenFieldProps, {}> { }



}

