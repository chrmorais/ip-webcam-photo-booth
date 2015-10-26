#include <TrinketKeyboard.h>

#define BUTTON_PIN 0

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  TrinketKeyboard.begin();
}

void loop()
{
  static bool prevButtonDown = false;
  bool buttonDown;

  TrinketKeyboard.poll();

  buttonDown = digitalRead(BUTTON_PIN) == LOW;
  if (buttonDown && !prevButtonDown) {
    TrinketKeyboard.typeChar(' ');
    delay(5);
  }
  prevButtonDown = buttonDown;
}
