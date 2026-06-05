// frontend/tests/components/auth/SliderControls.test.jsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SliderControls from "@/components/Auth/components/SliderControls/SliderControls";

const css = new Proxy({}, { get: (_, p) => p });

describe("<SliderControls>", () => {
  it("calls onToggle(false) when switching to Signup", async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();

    render(<SliderControls isLogin onToggle={onToggle} styles={css} />);
    await user.click(screen.getByLabelText(/signup/i));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

});
