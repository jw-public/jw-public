
  export function findBootstrapEnvironment(): string {
    let envs = ["xs", "sm", "md", "lg"];

    let $el = $("<div>");
    $el.appendTo($("body"));

    for (let i = envs.length - 1; i >= 0; i--) {
      let env = envs[i];

      $el.addClass("hidden-" + env);
      if ($el.is(":hidden")) {
        $el.remove();
        return env;
      }
    };
  }

  export function isBootstrapEnvironment(environment: string): boolean {
    return environment === findBootstrapEnvironment();
  }
