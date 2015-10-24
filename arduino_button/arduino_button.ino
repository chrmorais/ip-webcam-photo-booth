#define LED_PIN    13
#define BUTTON_PIN A0

#define IN_LED_OFF '0'
#define IN_LED_ON  '1'

#define OUT_BUTTON_PRESS 'b'

#define getButtonDown() (digitalRead(BUTTON_PIN) == LOW)

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  static bool prevButtonDown = false;
  bool buttonDown;

  if (Serial.available()) {
    switch (Serial.read()) {
      case IN_LED_OFF:
        digitalWrite(LED_PIN, LOW);
        break;
      case IN_LED_ON:
        digitalWrite(LED_PIN, HIGH);
        break;
    }
  }

  buttonDown = getButtonDown();
  if (buttonDown && !prevButtonDown) {
    Serial.write(OUT_BUTTON_PRESS);
    delay(5);
  }
  prevButtonDown = buttonDown;
}

