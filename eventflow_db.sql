-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: eventflow_db
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `certificados`
--

DROP TABLE IF EXISTS `certificados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `inscripcion_id` int NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'EXPOSITOR, PARTICIPANTE, ORGANIZADOR',
  `nombre_participante` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_pdf` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_certificado` (`evento_id`,`inscripcion_id`),
  KEY `inscripcion_id` (`inscripcion_id`),
  CONSTRAINT `certificados_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `certificados_ibfk_2` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificados`
--

LOCK TABLES `certificados` WRITE;
/*!40000 ALTER TABLE `certificados` DISABLE KEYS */;
INSERT INTO `certificados` VALUES (1,7,1,'PARTICIPANTE','Juan Carlos Rodriguez','/uploads/certificados/certificado_1_1783446560669.pdf','2026-06-16 21:26:21'),(43,7,2,'PARTICIPANTE','Melissa Ivonne Chero','/uploads/certificados/certificado_2_1783547290024.pdf','2026-07-07 16:50:24'),(60,7,4,'PARTICIPANTE','Lucía Ramírez','/uploads/certificados/certificado_4_1783549521927.pdf','2026-07-08 22:25:22');
/*!40000 ALTER TABLE `certificados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuraciones`
--

DROP TABLE IF EXISTS `configuraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuraciones` (
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuraciones`
--

LOCK TABLES `configuraciones` WRITE;
/*!40000 ALTER TABLE `configuraciones` DISABLE KEYS */;
INSERT INTO `configuraciones` VALUES ('logo_url','/uploads/logos/logo-1783621731945-334054384.png','Ruta del logo personalizado del sistema'),('max_intentos_login','5','Intentos fallidos antes de bloqueo temporal'),('nombre_sistema','','Nombre visible en el sistema'),('password_expiry_days','60','Días antes de forzar cambio de contraseña'),('vista_defecto_eventos','lista','Vista inicial en módulo eventos (tarjetas o lista)');
/*!40000 ALTER TABLE `configuraciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_opciones`
--

DROP TABLE IF EXISTS `encuesta_opciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuesta_opciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pregunta_id` int NOT NULL,
  `texto` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `pregunta_id` (`pregunta_id`),
  CONSTRAINT `encuesta_opciones_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `encuesta_preguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_opciones`
--

LOCK TABLES `encuesta_opciones` WRITE;
/*!40000 ALTER TABLE `encuesta_opciones` DISABLE KEYS */;
INSERT INTO `encuesta_opciones` VALUES (1,2,'Sí',0),(2,2,'No',1),(3,2,'Tal vez',2),(4,3,'IA',0),(5,3,'Microfinanzas',1),(6,3,'Liderazgo',2);
/*!40000 ALTER TABLE `encuesta_opciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_preguntas`
--

DROP TABLE IF EXISTS `encuesta_preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuesta_preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `encuesta_id` int NOT NULL,
  `texto` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('abierta','opcion_unica','opcion_multiple','escala') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'abierta',
  `orden` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `encuesta_id` (`encuesta_id`),
  CONSTRAINT `encuesta_preguntas_ibfk_1` FOREIGN KEY (`encuesta_id`) REFERENCES `encuestas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_preguntas`
--

LOCK TABLES `encuesta_preguntas` WRITE;
/*!40000 ALTER TABLE `encuesta_preguntas` DISABLE KEYS */;
INSERT INTO `encuesta_preguntas` VALUES (1,1,'¿Qué te pareció el evento?','abierta',0),(2,1,'¿Recomendarías el evento?','opcion_unica',1),(3,1,'¿Qué temas te interesaron?','opcion_multiple',2),(4,1,'Nivel de satisfacción general','escala',3);
/*!40000 ALTER TABLE `encuesta_preguntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_respuesta_detalle`
--

DROP TABLE IF EXISTS `encuesta_respuesta_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuesta_respuesta_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `respuesta_id` int NOT NULL,
  `pregunta_id` int NOT NULL,
  `opcion_id` int DEFAULT NULL,
  `valor` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `respuesta_id` (`respuesta_id`),
  CONSTRAINT `encuesta_respuesta_detalle_ibfk_1` FOREIGN KEY (`respuesta_id`) REFERENCES `encuesta_respuestas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_respuesta_detalle`
--

LOCK TABLES `encuesta_respuesta_detalle` WRITE;
/*!40000 ALTER TABLE `encuesta_respuesta_detalle` DISABLE KEYS */;
INSERT INTO `encuesta_respuesta_detalle` VALUES (1,1,1,NULL,'Muy bueno'),(2,1,2,1,NULL),(3,1,3,4,NULL),(4,1,3,5,NULL),(5,1,4,NULL,'5'),(6,2,1,NULL,'dfasfsd'),(7,2,2,1,NULL),(8,2,3,4,NULL),(9,2,4,NULL,'5');
/*!40000 ALTER TABLE `encuesta_respuesta_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_respuestas`
--

DROP TABLE IF EXISTS `encuesta_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuesta_respuestas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `encuesta_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `evento_id` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_resp` (`encuesta_id`,`usuario_id`),
  CONSTRAINT `encuesta_respuestas_ibfk_1` FOREIGN KEY (`encuesta_id`) REFERENCES `encuestas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_respuestas`
--

LOCK TABLES `encuesta_respuestas` WRITE;
/*!40000 ALTER TABLE `encuesta_respuestas` DISABLE KEYS */;
INSERT INTO `encuesta_respuestas` VALUES (1,1,10,7,'2026-07-08 21:42:41'),(2,1,12,7,'2026-07-08 22:25:17');
/*!40000 ALTER TABLE `encuesta_respuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuestas`
--

DROP TABLE IF EXISTS `encuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuestas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Encuesta de satisfacción',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_evento` (`evento_id`),
  CONSTRAINT `encuestas_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuestas`
--

LOCK TABLES `encuestas` WRITE;
/*!40000 ALTER TABLE `encuestas` DISABLE KEYS */;
INSERT INTO `encuestas` VALUES (1,7,'Encuesta de satisfacción SIM 2026','Ayúdanos a mejorar',1,'2026-07-08 20:01:06');
/*!40000 ALTER TABLE `encuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tema` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('Activo','Próximo','Finalizado') COLLATE utf8mb4_unicode_ci DEFAULT 'Próximo',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `capacidad` int DEFAULT NULL,
  `lugar` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expositor` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#dc2626',
  `horas_academicas` int DEFAULT NULL,
  `instructor` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `inscritos` int DEFAULT '0',
  `requiere_encuesta` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (2,'Seminario de Innovación Digital',NULL,'Seminario','Próximo','','2026-07-20',NULL,NULL,50,'Virtual (Zoom)','Ing. Ana Torres','#7e6767',0,'','2026-06-03 21:16:40',38,0),(3,'Taller de Negociación Avanzada',NULL,'Taller','Activo','','2026-06-01',NULL,NULL,20,'Lima, Perú','Lic. Roberto Díaz','#1e8a44',0,'','2026-06-03 21:16:40',18,0),(7,'Seminario internacional de Microfinanzas Arequipa 2026','Cuando la inteligencia artificial amplifica lo humano, el valor se multiplica: Marcas con propósito al servicio de las personas','Seminario','Activo','','2026-06-24','2026-06-26','09:00:00',700,'Arequipa','','#1e13be',24,'FEPCMAC','2026-06-03 21:28:33',0,1),(8,'Congreso Internacional de Microfinanzas Piura 2026',NULL,'Congreso','Activo','','2026-10-14','2026-10-16','14:00:00',600,'Piura - Presencial','Por definir','#12729b',22,'FEPCMAC','2026-06-03 21:45:04',0,0);
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  `fecha_inscripcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Inscrito',
  `calidad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'PARTICIPANTE',
  `progreso` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `evento_id` (`evento_id`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (1,9,7,'2026-06-16 20:14:51','Inscrito','PARTICIPANTE',0),(2,10,7,'2026-07-07 16:50:12','Inscrito','PARTICIPANTE',0),(4,12,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0),(5,13,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0),(6,14,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0),(7,15,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0),(8,16,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0),(9,17,7,'2026-07-08 16:26:13','Inscrito','PARTICIPANTE',0);
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materiales`
--

DROP TABLE IF EXISTS `materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `sesion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_original` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_archivo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamaño` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `url_descarga` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subido_por` int DEFAULT NULL,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `evento_id` (`evento_id`),
  KEY `subido_por` (`subido_por`),
  CONSTRAINT `materiales_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `materiales_ibfk_2` FOREIGN KEY (`subido_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materiales`
--

LOCK TABLES `materiales` WRITE;
/*!40000 ALTER TABLE `materiales` DISABLE KEYS */;
INSERT INTO `materiales` VALUES (22,8,'Presentacion','','','',0,'','',NULL,'2026-06-08 22:18:46'),(23,8,'Presentacion','Gantt_PeruÌ_S v.2026 (1 sesion extendido).pdf','1780957151648-764463437-Gantt_PeruÌ_S v.2026 (1 sesion extendido).pdf','application/pdf',42730,'dfasfds','/uploads/materiales/1780957151648-764463437-Gantt_PeruÌ_S v.2026 (1 sesion extendido).pdf',NULL,'2026-06-08 22:19:11'),(24,8,'Sesion 01','','','',0,'','',NULL,'2026-06-08 22:37:40'),(25,8,'Sesion 01','Modelos de integraciÃ³n.pdf','1780958295213-493298778-Modelos de integraciÃ³n.pdf','application/pdf',59283582,'','/uploads/materiales/1780958295213-493298778-Modelos de integraciÃ³n.pdf',NULL,'2026-06-08 22:38:15'),(26,8,'Sesion 01','TAREA DE INGLISH Xd.pdf','1780959179426-688930041-TAREA DE INGLISH Xd.pdf','application/pdf',125489,'','/uploads/materiales/1780959179426-688930041-TAREA DE INGLISH Xd.pdf',NULL,'2026-06-08 22:52:59'),(27,8,'Sesion 02','','','',0,'','',NULL,'2026-06-08 22:53:42'),(28,8,'Sesion 02','Concur SAP.pdf','1780959254143-14666534-Concur SAP.pdf','application/pdf',1169029,'','/uploads/materiales/1780959254143-14666534-Concur SAP.pdf',NULL,'2026-06-08 22:54:14'),(29,7,'Sesión 01','','','',0,'','',NULL,'2026-07-07 23:04:29'),(30,7,'Sesión 01','cert_1_1783442645071.pdf','1783465487558-749995665-cert_1_1783442645071.pdf','application/pdf',2249239,'','/uploads/materiales/1783465487558-749995665-cert_1_1783442645071.pdf',NULL,'2026-07-07 23:04:47');
/*!40000 ALTER TABLE `materiales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantillas_certificados`
--

DROP TABLE IF EXISTS `plantillas_certificados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas_certificados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_plantilla` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pos_nombre_x` int DEFAULT '420',
  `pos_nombre_y` int DEFAULT '380',
  `pos_tema_x` int DEFAULT '420',
  `pos_tema_y` int DEFAULT '450',
  `pos_calidad_x` int DEFAULT '420',
  `pos_calidad_y` int DEFAULT '550',
  `pos_fecha_x` int DEFAULT '420',
  `pos_fecha_y` int DEFAULT '650',
  `font_nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Helvetica-Bold',
  `font_size_nombre` int DEFAULT '24',
  `color_nombre` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#1e3a8a',
  `font_tema` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Helvetica',
  `font_size_tema` int DEFAULT '16',
  `color_tema` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#3b82f6',
  `font_calidad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Helvetica-Bold',
  `font_size_calidad` int DEFAULT '18',
  `color_calidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#1e3a8a',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo_nombre` tinyint(1) DEFAULT '1',
  `activo_tema` tinyint(1) DEFAULT '0',
  `activo_calidad` tinyint(1) DEFAULT '1',
  `activo_fecha` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `evento_id` (`evento_id`),
  CONSTRAINT `plantillas_certificados_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas_certificados`
--

LOCK TABLES `plantillas_certificados` WRITE;
/*!40000 ALTER TABLE `plantillas_certificados` DISABLE KEYS */;
INSERT INTO `plantillas_certificados` VALUES (1,7,NULL,'/uploads/plantillas/plantilla_7_1781630101202.png',65,31,50,52,65,64,50,80,'Helvetica-Bold',24,'#1e3a8a','Helvetica',16,'#3b82f6','Helvetica-Bold',18,'#1e3a8a','2026-06-16 17:15:01',1,0,1,0);
/*!40000 ALTER TABLE `plantillas_certificados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','participante') COLLATE utf8mb4_unicode_ci DEFAULT 'participante',
  `dni` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password_changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `foto_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','Principal','admin@eventflow.com','$2b$10$X7... (hash_simulado)','admin',NULL,NULL,'Activo','2026-06-03 17:55:04','2026-06-04 02:01:12',NULL),(2,'Administrador','FEPCMAC','admin@fepcmac.com','123456','admin',NULL,NULL,'Activo','2026-06-03 20:08:36','2026-06-04 02:01:12',NULL),(4,'Carlos','Mendoza Ruiz','carlos.mendoza@email.com','123456','participante','12345678','+51 987 654 321','Activo','2026-06-03 21:51:07','2026-06-05 13:45:02',NULL),(5,'Ana','Torres Silva','ana.torres@email.com','123456','participante','87654321','+51 912 345 678','Activo','2026-06-03 21:51:07','2026-06-04 02:01:12',NULL),(7,'Juan Carlos','Morales R.','jmorales@fpcmac.org.pe','123456','admin','99999999','888999777','Activo','2026-06-03 22:16:39','2026-06-04 02:01:12',NULL),(9,'Juan Carlos','Rodriguez','jcrodriguez@email.com','123456','participante','99999999','936338640','Activo','2026-06-16 20:14:51','2026-06-16 20:14:51',NULL),(10,'Melissa Ivonne','Chero','mchero@fpcmac.org.pe','123456','participante','88888888','55555555','Activo','2026-07-07 16:50:12','2026-07-07 16:50:12',NULL),(12,'Lucía','Ramírez','lucia.ramirez@example.com','45872136','participante','45872136','987654321','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL),(13,'Mateo','Gómez','mateo.gomez@example.com','73194528','participante','73194528','912345678','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL),(14,'Valeria','Torres','valeria.torres@example.com','68421975','participante','68421975','956781234','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL),(15,'Diego','Castillo','diego.castillo@example.com','52981467','participante','52981467','998123456','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL),(16,'Camila','Paredes','camila.paredes@example.com','61735284','participante','61735284','934567812','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL),(17,'Sebastián','Vargas','sebastian.vargas@example.com','79246815','participante','79246815','976543210','Activo','2026-07-08 16:26:13','2026-07-08 16:26:13',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'eventflow_db'
--

--
-- Dumping routines for database 'eventflow_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-09 14:59:56
