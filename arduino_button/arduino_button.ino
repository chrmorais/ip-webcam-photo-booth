/**
 * Photo booth button.
 *
 * Serial interface:
 *   Receive '0': turn light off.
 *   Receive '1': turn light on.
 *   Receive 'f': fade light on and off.
 *
 *   Writes 'b' on button pushes.
 */

// Includes

#include <digitalWriteFast.h>

// Config

#define BUTTON_PIN 4
#define LED_PIN    3

#define BUTTON_MIN_PRESS_DURATION 10

#define LED_MAX_BRIGHTNESS 255

#define LED_FADE_MIN_BRIGHTNESS    0
#define LED_FADE_STEP_DURATION     10
#define LED_FADE_PAUSE_BEFORE_DOWN 200
#define LED_FADE_PAUSE_BEFORE_UP   100

// Macros & constants

#define IS_BUTTON_PRESSED() (digitalReadFast2(BUTTON_PIN) == LOW)

#define BUTTON_STATE_UP       0
#define BUTTON_STATE_PRESSING 1
#define BUTTON_STATE_PRESSED  2

#define LED_MODE_OFF  0
#define LED_MODE_ON   1
#define LED_MODE_FADE 2

#define LED_FADE_DIRECTION_UP    1
#define LED_FADE_DIRECTION_DOWN -1

// Globals

int ledMode;
int ledNextActionMillis;
int ledBrightness;
int ledFadeDirection;

// Program

void setup() {
  Serial.begin(9600);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN,    OUTPUT);

  setLedMode(LED_MODE_OFF);
}

void loop() {
  updateSerialIn();
  updateButton();
  updateLed();
}

void updateSerialIn() {
  if (!Serial.available()) {
    return;
  }

  switch (Serial.read()) {
    case '0':
      setLedMode(LED_MODE_OFF);
      break;

    case '1':
      setLedMode(LED_MODE_ON);
      break;

    case 'f':
      setLedMode(LED_MODE_FADE);
      break;
  }
}

void updateButton() {
  static int buttonState = BUTTON_STATE_UP;
  static unsigned long buttonWillPressAt;

  bool buttonPressed;

  buttonPressed = IS_BUTTON_PRESSED();

  if (buttonPressed) {
    switch (buttonState) {
      case BUTTON_STATE_UP:
        buttonWillPressAt = millis() + BUTTON_MIN_PRESS_DURATION;
        buttonState = BUTTON_STATE_PRESSING;
        break;

      case BUTTON_STATE_PRESSING:
        if (millis() >= buttonWillPressAt) {
          buttonState = BUTTON_STATE_PRESSED;
          didPressButton();
        }
        break;
    }
  }

  if (!buttonPressed) {
    buttonState = BUTTON_STATE_UP;
  }
}

void didPressButton() {
  Serial.println('b');
}

void setLedMode(int newLedMode) {
  if (newLedMode == ledMode) {
    return;
  }

  switch (newLedMode) {
    case LED_MODE_OFF:
      ledBrightness = 0;
      break;

    case LED_MODE_ON:
      ledBrightness = LED_MAX_BRIGHTNESS;
      break;

    case LED_MODE_FADE:
      switch (ledMode) {
        case LED_MODE_OFF:
          ledBrightness = LED_FADE_MIN_BRIGHTNESS;
          ledFadeDirection = LED_FADE_DIRECTION_UP;
          break;

        case LED_MODE_ON:
          ledBrightness = LED_MAX_BRIGHTNESS;
          ledFadeDirection = LED_FADE_DIRECTION_DOWN;
          break;
      }
      break;
  }

  ledMode = newLedMode;
  ledNextActionMillis = 0;

  updateLed();
}

void updateLed() {
  if (ledNextActionMillis == -1 || millis() < ledNextActionMillis) {
    return;
  }

  switch (ledMode) {
    case LED_MODE_OFF:
      ledBrightness = 0;
      ledNextActionMillis = -1;
      break;

    case LED_MODE_ON:
      ledBrightness = 255;
      ledNextActionMillis = -1;
      break;

    case LED_MODE_FADE:
      ledBrightness += ledFadeDirection;

      ledNextActionMillis = millis() + LED_FADE_STEP_DURATION;

      if (ledBrightness > LED_MAX_BRIGHTNESS) {
        ledBrightness = LED_MAX_BRIGHTNESS - 1;
        ledFadeDirection = LED_FADE_DIRECTION_DOWN;
        ledNextActionMillis += LED_FADE_PAUSE_BEFORE_DOWN;
      }

      if (ledBrightness < LED_FADE_MIN_BRIGHTNESS) {
        ledBrightness = LED_FADE_MIN_BRIGHTNESS + 1;
        ledFadeDirection = LED_FADE_DIRECTION_UP;
        ledNextActionMillis += LED_FADE_PAUSE_BEFORE_UP;
      }

      break;
  }

  analogWrite(LED_PIN, ledBrightness);
}

