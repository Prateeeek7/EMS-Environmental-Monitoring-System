Financial Aid Proposal Report
Project Title:
Development of an Industrial-Grade Environmental Monitoring and Analysis System with Multi-Sensor Data Intelligence
1. Project Overview
This project aims to design and develop a smart, industrial-grade prototype for environmental monitoring, capable of measuring temperature, humidity, and multiple gas concentrations, with real-time data analysis and machine learning integration for research-driven decision-making.
Existing low-cost modules like DHT11 and MQ-6 are suitable for basic educational projects but lack accuracy, calibration stability, and scalability. The upgraded system will employ precision-grade sensors capable of high-resolution, long-duration operation in research facilities, greenhouses, and laboratories.
The prototype will not only collect real-time multi-parameter data but also train a facility-specific ML model for environmental anomaly detection, predictive control, and correlation analytics, turning raw sensor readings into actionable insights via a customized Retrieval-Augmented Generation (RAG) pipeline that fuses live telemetry with historical facility knowledge.
2. Objectives
Replace consumer-grade sensors with industrial-grade precision modules for temperature, humidity, and gas detection.
Design a modular IoT node based on ESP32 / Raspberry Pi for scalable deployment.
Develop a data acquisition and analysis pipeline (local + cloud) for continuous logging that feeds a customized RAG workflow combining streaming data with archived context.
Implement a custom machine learning model trained on collected facility data and iteratively refined through the RAG pipeline for research-grade analytics.
Validate the system through real-environment testing (lab, greenhouse, or research room).
3. Proposed Sensor Architecture
Each core environmental parameter will be monitored by two advanced sensors — for redundancy, cross-validation, and improved reliability.
Parameter	Existing Sensor	Proposed Advanced Sensors (2 per category)	Function / Justification
Temperature & Humidity	DHT11	1. BME280 (Bosch) 2. SHT35 (Sensirion)	High-precision temperature (±0.1°C) and humidity (±1.5% RH), pressure data for environment modeling. Enables dew-point and VPD calculations.
CO₂ Concentration	–	1. MH-Z19C (Winsen) 2. Senseair S8	Industrial-grade NDIR sensors with calibrated CO₂ readings (0–5000 ppm). Essential for occupancy, ventilation, and plant-growth analysis.
Volatile Organic Compounds (VOCs)	MQ-6	1. BME680 (Bosch) 2. SGP30 (Sensirion)	Provide Total VOC and equivalent CO₂ (eCO₂) readings with built-in calibration and IAQ index. Detect chemical or gas anomalies.
Particulate Matter (PM2.5 / PM10)	–	1. PMS5003 (Plantower) 2. SDS011 (Nova Fitness)**	Laser scattering sensors that measure fine dust and particulate concentrations, ideal for lab air quality monitoring.
Pressure & Altitude	–	1. BMP388 (Bosch) 2. LPS22HB (STMicro)**	Accurate barometric pressure sensing for environmental compensation and atmospheric correlation.
Ambient Light	–	1. BH1750 (ROHM) 2. TSL2591 (AMS)**	Measure light intensity for greenhouse control and photometric correlation with humidity/temperature changes.
Airflow / Ventilation	–	1. FS7 Flow Sensor 2. Omron D6F Series	Detect airflow rate and ventilation efficiency, crucial for maintaining air exchange and stability.
Data Logging & Timing	–	1. DS3231 RTC 2. MicroSD Module	Accurate timestamp logging and offline data storage for continuous monitoring and ML dataset creation.
4. Technical Architecture
Hardware:
ESP32-WROOM Dev Board as main MCU for wireless data communication (Wi-Fi/BLE).
I²C and UART buses to interface with multiple digital sensors.
5V regulated power supply (2A) with surge protection.
Modular PCB for hot-swappable sensor connectors.
Software Stack:
Firmware: Arduino / MicroPython
Cloud: Firebase / InfluxDB + Node-RED dashboard
ML pipeline: Python (Pandas, Scikit-Learn, TensorFlow Lite for edge inference) with a RAG loop that pairs real-time sensor data with curated facility datasets for adaptive model updates
Visualization: Grafana dashboard for real-time monitoring
5. Financial Requirement
Component	Quantity	Unit Cost (INR)	Total (INR)	Remarks
ESP32-WROOM Module	2	700	1,400	Core microcontroller
BME280 Sensor	2	600	1,200	Temp/Humidity/Pressure
SHT35 Sensor	2	1,500	3,000	High-accuracy humidity
MH-Z19C CO₂ Sensor	2	2,500	5,000	NDIR CO₂
Senseair S8 CO₂ Sensor	1	4,800	4,800	Industrial reference CO₂
BME680 VOC Sensor	2	1,800	3,600	TVOC/eCO₂ detection
SGP30 VOC Sensor	2	1,400	2,800	Complementary VOC detection
PMS5003 PM Sensor	2	2,500	5,000	Fine dust monitoring
SDS011 PM Sensor	1	2,200	2,200	PM validation sensor
BMP388 Pressure Sensor	1	600	600	Atmospheric compensation
LPS22HB Pressure Sensor	1	800	800	Secondary barometric
BH1750 Light Sensor	2	250	500	Light intensity measurement
TSL2591 Light Sensor	1	700	700	High-range lux meter
Airflow Sensor (Omron D6F)	1	3,500	3,500	Industrial-grade airflow
FS7 Flow Sensor	1	2,000	2,000	Ventilation cross-check
DS3231 RTC Module	2	250	500	Time synchronization
MicroSD Module	2	300	600	Local data backup
PCB Fabrication & Enclosure	1	3,500	3,500	Custom enclosure + PCB
Power Supply, Wires, Connectors	–	1,500	1,500	Miscellaneous
Total Estimated Cost	–	–	₹42,200	(~USD 500)
6. Expected Outcomes
Fully functional industrial-grade prototype with redundant high-accuracy sensors.
Dataset generation for long-term environmental monitoring.
Facility-specific ML model for environmental anomaly detection and forecasting, continuously improved through RAG-based retraining from live telemetry.
Research publication on multi-sensor fusion and predictive analysis using AI.
Open-source data pipeline and dashboard, potentially scalable to campus-wide smart environmental systems.
7. Impact & Scope
Can be deployed in university research labs, greenhouses, clean rooms, or industrial facilities for continuous monitoring.
Supports academic research in IoT, data science, and AI-driven sustainability.
Provides real-world validation and publication opportunity under smart facility management systems.
8. Funding Request
We request a financial grant of ₹42,200 to procure and integrate advanced sensors, components, and data acquisition infrastructure required to build and validate the industrial prototype.
The project aligns with VIT’s vision of promoting AI-integrated smart environments and supports student-led innovation under the CSI (Computer Society of India) core design and research initiative.
9. Project Duration
Phase	Timeline	Deliverable
Phase 1 – Sensor Procurement & Hardware Setup	2 Weeks	Complete sensor interfacing and testing
Phase 2 – Data Logging & Cloud Integration	3 Weeks	Real-time data pipeline & dashboard
Phase 3 – ML Model Training & Validation	4 Weeks	Facility-specific predictive model
Phase 4 – Prototype Demonstration & Report	1 Week	Final report & publication draft
Total Duration: ~10 weeks
10. Team
Principal Investigator: Pratik Kumar, Junior Core Member, CSI VIT Vellore
Faculty Mentor: Prof. Namke, Dept. of ECE
Team Members: Thakur Chand Choudhary (Systems Integration Lead)
11. Expected Deliverables
Industrial-grade prototype (IoT node + dashboard)
Dataset and ML model codebase
IEEE-format research paper (planned submission to Smart Environment / IoT conference)
Demonstration video and project documentation
Conclusion
This project seeks funding to upgrade the current sensor infrastructure to industrial and research-grade modules, allowing for accurate environmental intelligence and AI-powered analysis.
It will serve as both a technological proof of concept and a publication-ready research platform, contributing to VIT’s mission toward innovation, sustainability, and applied AI. The RAG-enhanced training loop ensures that every new data point strengthens the customized facility model, accelerating research outcomes.

12. Appendix – Future Use Cases with RAG-Enabled Analytics
•	The RAG pipeline will allow researchers to query historical environmental states alongside real-time readings, enabling rapid root-cause analysis and evidence-backed policy adjustments for the facility.
•	Customized model checkpoints generated from continuous training can seed deployments in new departments, reducing calibration time for additional laboratories or greenhouses.
•	Facility managers can fuse maintenance records, safety SOPs, and live sensor feeds through the RAG interface, creating actionable alerts for preventive interventions.
•	The modular architecture encourages future multimodal expansions—such as integrating computer vision feeds—while preserving compatibility with the existing RAG-driven knowledge base.