const int pot0 = A0;
const int pot1 = A1;



void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.print(analogRead(pot0));
  Serial.print(",");
  Serial.println(analogRead(pot1));
  delay(200);
}
