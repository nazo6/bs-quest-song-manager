import {
  useMantineColorScheme,
  Group,
  SegmentedControl,
  MantineColorScheme,
} from "@mantine/core";
import { useEffect } from "react";

const changeTailwindColorScheme = (colorScheme: "light" | "dark") => {
  if (colorScheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
};

export function ThemeSelector() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  useEffect(() => {
    const deviceColorSchemeListener = (event: MediaQueryListEvent) => {
      if (colorScheme === "auto") {
        changeTailwindColorScheme(event.matches ? "dark" : "light");
      }
    };

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", deviceColorSchemeListener);

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", deviceColorSchemeListener);
    };
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (colorScheme === "auto") {
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        changeTailwindColorScheme("dark");
      } else {
        changeTailwindColorScheme("light");
      }
    } else {
      changeTailwindColorScheme(colorScheme);
    }
  }, [colorScheme, setColorScheme]);

  return (
    <Group>
      <SegmentedControl
        size="xs"
        data={["light", "dark", "auto"]}
        value={colorScheme}
        onChange={(value) => setColorScheme(value as MantineColorScheme)}
      />
    </Group>
  );
}
