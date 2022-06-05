/**
 * Created by Dominik on 28.06.2015.
 *
 * Diese Paketdefinition ist unvollständig. Stand Juni 2015
 */

declare module 'meteor/ostrio:flow-router-extra' {
  namespace FlowRouter {
    interface Middleware {
      (path: string, next: () => void): void;
    }

    interface Parameters {
      [key: string]: string;
    }

    interface Context {
      params?: Parameters;
      queryParams?: Parameters;
      path?: string;
      route?: RouteDefinition;
      oldRoute?: RouteDefinition;
      querystring?: string;
    }

    interface Trigger {
      (context: Context, redirect?: (path: string) => void): void;
    }


    interface RouteDefinition {
      // define your subscriptions
      subscriptions?: (params: Parameters, queryParams: Parameters) => void;

      // do some action for this route
      action: (params: Parameters, queryParams: Parameters) => void;

      name?: string;

      triggersEnter?: Array<Trigger>;
      triggersExit?: Array<Trigger>;

      path?: String;
    }

    var notFound: RouteDefinition;

    function route(path: string, routeDefinition: RouteDefinition): void;
    function getParam(paramName: string): string;
    function getQueryParam(paramName: string): string;
    function getRouteName(): string;
    function path(nameOfRoute: string, params?: Parameters, queryParams?: Parameters): string;
    function go(pathDef: string, params?: Parameters, queryParams?: Parameters): void;
  }
}

declare module BlazeLayout {
  function render<T>(templateName: string, templateContext?: T): void;
  function setRoot(selector: string): void;
}
