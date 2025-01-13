void setup()
{
  pinMode(10, OUTPUT);
  Serial.begin(9600);
  digitalWrite(10, LOW); // Ensure we start in a known state
}

const int samples = 10;
const int sampleDelay = 10;
bool pinHighState = false; // Track the intended state of pin 10

float getStableVoltage(int pin)
{
  long sum = 0;
  for (int i = 0; i < samples; i++)
  {
    sum += analogRead(pin);
    delay(sampleDelay);
  }
  float avgReading = sum / samples;
  return avgReading * (3.3 / 1023.0);
}

void printJSON(float v1, float v2)
{
  Serial.print("{");
  Serial.print("\"voltage\":");
  Serial.print(v1, 3); // 3 decimal places
  Serial.print(",\"current_sense\":");
  Serial.print(v2, 3);
  Serial.print(",\"load_active\":");
  Serial.print(pinHighState ? "true" : "false");
  Serial.println("}");
}

void loop()
{
  if (Serial.available() > 0)
  {
    String data = Serial.readStringUntil('\n');
    data.trim();

    if (data == "load")
    {
      pinHighState = !pinHighState;
      digitalWrite(10, pinHighState);
    }
  }

  float voltageA1 = getStableVoltage(A1);
  float voltageA2 = getStableVoltage(A2);

  printJSON(voltageA1, voltageA2);

  delay(1000);
}