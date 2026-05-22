export const maskCpfPartially = (cpf?: string) => {
  if (!cpf) return '***.***.***-**';
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return '***.***.***-**';
  return `***.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-**`;
};
