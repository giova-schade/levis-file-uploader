def validate(value, min, max):
    try:
        valor_numerico = float(value)
        if valor_numerico < min or valor_numerico > max:
            return False, f"El campo debe estar dentro del rango de {min} a {max}"
    except ValueError:
        return False, "El valor no es un número"
    return True, None
