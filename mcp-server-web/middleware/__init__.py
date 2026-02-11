from middleware.send_email import gmail_service_generator


service_gen = gmail_service_generator()

gmail_service = next(service_gen)
