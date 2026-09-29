import { render } from "irisout";
import { signIn, signUp } from "../auth-client.ts";
import { AuthScreen } from "./AuthScreen.tsx";

export function AuthFlow({
  checking,
  user,
  mode,
  email,
  password,
  displayName,
  status,
  busy,
  onFail,
}) {
  render(
    <AuthScreen
      checking={checking}
      user={user}
      mode={mode}
      email={email}
      password={password}
      displayName={displayName}
      status={status}
      busy={busy}
      onSubmit={submit}
      onSwitch={switchMode}
      onEmail={email}
      onPassword={password}
      onDisplayName={displayName}
    />,
  );

  function switchMode() {
    mode(mode() === "signin" ? "signup" : "signin");
    status("");
  }

  function submit(event) {
    event.preventDefault();
    busy(true);
    const action =
      mode() === "signup"
        ? signUp(displayName(), email(), password())
        : signIn(email(), password());
    action.then(() => window.location.reload()).catch(onFail);
  }
}
